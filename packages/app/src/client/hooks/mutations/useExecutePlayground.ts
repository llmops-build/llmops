import { hc } from '@client/lib/hc';
import { getBasePath } from '@client/lib/api-base';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { getQueryKey as getRunsQueryKey } from '../queries/usePlaygroundRuns';
import { getQueryKey as getResultsQueryKey } from '../queries/usePlaygroundResults';

// SSE Event types
export type SSEEvent =
  | { type: 'run_started'; data: { runId: string; totalCells: number } }
  | {
      type: 'cell_started';
      data: { resultId: string; columnId: string; recordId: string | null };
    }
  | { type: 'cell_token'; data: { resultId: string; token: string } }
  | {
      type: 'cell_completed';
      data: {
        resultId: string;
        output: string;
        latencyMs: number;
        promptTokens: number | null;
        completionTokens: number | null;
        totalTokens: number | null;
      };
    }
  | { type: 'cell_failed'; data: { resultId: string; error: string } }
  | {
      type: 'run_completed';
      data: { runId: string; completedCount: number; failedCount: number };
    }
  | { type: 'error'; data: { message: string } };

export type CellState = {
  resultId: string;
  columnId: string;
  recordId: string | null;
  inputVariables?: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output: string;
  error?: string;
  latencyMs?: number;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
};

export type ExecutionState = {
  runId: string | null;
  isRunning: boolean;
  totalCells: number;
  completedCells: number;
  failedCells: number;
  cells: Map<string, CellState>;
};

export const useExecutePlayground = (playgroundId: string) => {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  const [executionState, setExecutionState] = useState<ExecutionState>({
    runId: null,
    isRunning: false,
    totalCells: 0,
    completedCells: 0,
    failedCells: 0,
    cells: new Map(),
  });

  const stopExecution = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setExecutionState((prev) => ({
      ...prev,
      isRunning: false,
    }));
  }, []);

  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await hc.v1.playgrounds[':id'].execute.$post({
        param: { id: playgroundId },
      });
      const result = await response.json();
      if ('data' in result && result.data) {
        return result.data as { runId: string; totalCells: number };
      }
      throw new Error(
        'error' in result && result.error && typeof result.error === 'object' && 'message' in result.error
          ? String(result.error.message)
          : 'Failed to start execution'
      );
    },
    onSuccess: async (data) => {
      const { runId, totalCells } = data;

      // Initialize execution state
      setExecutionState({
        runId,
        isRunning: true,
        totalCells,
        completedCells: 0,
        failedCells: 0,
        cells: new Map(),
      });

      // Connect to SSE stream
      const basePath = getBasePath();
      const url = `${basePath}/api/v1/playgrounds/${playgroundId}/execute/stream?runId=${runId}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('run_started', (event) => {
        const data = JSON.parse(event.data);
        setExecutionState((prev) => ({
          ...prev,
          totalCells: data.totalCells,
        }));
      });

      eventSource.addEventListener('cell_started', (event) => {
        const data = JSON.parse(event.data);
        setExecutionState((prev) => {
          const cells = new Map(prev.cells);
          cells.set(data.resultId, {
            resultId: data.resultId,
            columnId: data.columnId,
            recordId: data.recordId,
            status: 'running',
            output: '',
          });
          return { ...prev, cells };
        });
      });

      eventSource.addEventListener('cell_token', (event) => {
        const data = JSON.parse(event.data);
        setExecutionState((prev) => {
          const cells = new Map(prev.cells);
          const cell = cells.get(data.resultId);
          if (cell) {
            cells.set(data.resultId, {
              ...cell,
              output: cell.output + data.token,
            });
          }
          return { ...prev, cells };
        });
      });

      eventSource.addEventListener('cell_completed', (event) => {
        const data = JSON.parse(event.data);
        setExecutionState((prev) => {
          const cells = new Map(prev.cells);
          const cell = cells.get(data.resultId);
          if (cell) {
            cells.set(data.resultId, {
              ...cell,
              status: 'completed',
              output: data.output,
              latencyMs: data.latencyMs,
              promptTokens: data.promptTokens,
              completionTokens: data.completionTokens,
              totalTokens: data.totalTokens,
            });
          }
          return {
            ...prev,
            cells,
            completedCells: prev.completedCells + 1,
          };
        });
      });

      eventSource.addEventListener('cell_failed', (event) => {
        const data = JSON.parse(event.data);
        setExecutionState((prev) => {
          const cells = new Map(prev.cells);
          const cell = cells.get(data.resultId);
          if (cell) {
            cells.set(data.resultId, {
              ...cell,
              status: 'failed',
              error: data.error,
            });
          }
          return {
            ...prev,
            cells,
            failedCells: prev.failedCells + 1,
          };
        });
      });

      eventSource.addEventListener('run_completed', (event) => {
        const data = JSON.parse(event.data);
        setExecutionState((prev) => ({
          ...prev,
          isRunning: false,
          completedCells: data.completedCount,
          failedCells: data.failedCount,
        }));
        eventSource.close();
        eventSourceRef.current = null;

        // Invalidate queries
        queryClient.invalidateQueries({
          queryKey: getRunsQueryKey(playgroundId),
        });
        queryClient.invalidateQueries({
          queryKey: getResultsQueryKey(playgroundId, runId),
        });
      });

      eventSource.addEventListener('error', (event) => {
        console.error('SSE error:', event);
        setExecutionState((prev) => ({
          ...prev,
          isRunning: false,
        }));
        eventSource.close();
        eventSourceRef.current = null;
      });
    },
  });

  const execute = useCallback(() => {
    if (executionState.isRunning) return;
    startMutation.mutate();
  }, [executionState.isRunning, startMutation]);

  return {
    execute,
    stopExecution,
    executionState,
    isStarting: startMutation.isPending,
    startError: startMutation.error,
  };
};
