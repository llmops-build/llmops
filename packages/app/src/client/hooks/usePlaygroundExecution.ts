import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePlaygroundRuns,
  getQueryKey as getRunsQueryKey,
} from './queries/usePlaygroundRuns';
import { usePlaygroundResults } from './queries/usePlaygroundResults';
import { getBasePath } from '@client/lib/api-base';

// SSE Event data types matching the server

export type CellResult = {
  columnId: string;
  recordId: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output: string;
  error?: string;
  latencyMs?: number;
};

// Key for cell results: `${columnId}:${recordId || 'manual'}`
export type CellKey = string;

export function makeCellKey(
  columnId: string,
  recordId: string | null,
): CellKey {
  return `${columnId}:${recordId || 'manual'}`;
}

export type ExecutionState = {
  isRunning: boolean;
  runId: string | null;
  totalCells: number;
  completedCells: number;
  failedCells: number;
  results: Map<CellKey, CellResult>;
};

export function usePlaygroundExecution(playgroundId: string) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ExecutionState>({
    isRunning: false,
    runId: null,
    totalCells: 0,
    completedCells: 0,
    failedCells: 0,
    results: new Map(),
  });
  const [hasLoadedPersistedResults, setHasLoadedPersistedResults] =
    useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const resultIdToCellKeyRef = useRef<Map<string, CellKey>>(new Map());

  // Fetch persisted runs to get the latest completed run
  const { data: runs } = usePlaygroundRuns(playgroundId);

  // Find the latest completed run
  const latestCompletedRun = runs?.find(
    (run) => run.status === 'completed' || run.status === 'failed',
  );

  // Fetch results for the latest completed run
  const { data: persistedResults } = usePlaygroundResults(
    playgroundId,
    latestCompletedRun?.id ?? '',
  );

  // Load persisted results into state on initial load
  useEffect(() => {
    if (
      !hasLoadedPersistedResults &&
      persistedResults &&
      persistedResults.length > 0 &&
      !state.isRunning
    ) {
      const resultsMap = new Map<CellKey, CellResult>();
      let completedCount = 0;
      let failedCount = 0;

      for (const result of persistedResults) {
        const cellKey = makeCellKey(result.columnId, result.datasetRecordId);
        resultsMap.set(cellKey, {
          columnId: result.columnId,
          recordId: result.datasetRecordId,
          status: result.status,
          output: result.outputContent ?? '',
          error: result.error ?? undefined,
          latencyMs: result.latencyMs ?? undefined,
        });

        if (result.status === 'completed') completedCount++;
        if (result.status === 'failed') failedCount++;
      }

      setState({
        isRunning: false,
        runId: latestCompletedRun?.id ?? null,
        totalCells: persistedResults.length,
        completedCells: completedCount,
        failedCells: failedCount,
        results: resultsMap,
      });
      setHasLoadedPersistedResults(true);
    }
  }, [
    persistedResults,
    hasLoadedPersistedResults,
    state.isRunning,
    latestCompletedRun?.id,
  ]);

  const startExecution = useCallback(async () => {
    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Reset state
    setState({
      isRunning: true,
      runId: null,
      totalCells: 0,
      completedCells: 0,
      failedCells: 0,
      results: new Map(),
    });
    resultIdToCellKeyRef.current = new Map();

    try {
      // Start the run
      const basePath = getBasePath();
      const response = await fetch(
        `${basePath}/api/v1/playgrounds/${playgroundId}/execute`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to start execution');
      }

      const result = await response.json();
      const { runId, totalCells } = result.data;

      setState((prev) => ({
        ...prev,
        runId,
        totalCells,
      }));

      // Connect to SSE stream
      const eventSource = new EventSource(
        `${basePath}/api/v1/playgrounds/${playgroundId}/execute/stream?runId=${runId}`,
      );
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('run_started', (event) => {
        const data = JSON.parse(event.data);
        setState((prev) => ({
          ...prev,
          totalCells: data.totalCells,
        }));
      });

      eventSource.addEventListener('cell_started', (event) => {
        const data = JSON.parse(event.data);
        const cellKey = makeCellKey(data.columnId, data.recordId);
        resultIdToCellKeyRef.current.set(data.resultId, cellKey);

        setState((prev) => {
          const newResults = new Map(prev.results);
          newResults.set(cellKey, {
            columnId: data.columnId,
            recordId: data.recordId,
            status: 'running',
            output: '',
          });
          return { ...prev, results: newResults };
        });
      });

      eventSource.addEventListener('cell_token', (event) => {
        const data = JSON.parse(event.data);
        const cellKey = resultIdToCellKeyRef.current.get(data.resultId);
        if (!cellKey) return;

        setState((prev) => {
          const newResults = new Map(prev.results);
          const existing = newResults.get(cellKey);
          if (existing) {
            newResults.set(cellKey, {
              ...existing,
              output: existing.output + data.token,
            });
          }
          return { ...prev, results: newResults };
        });
      });

      eventSource.addEventListener('cell_completed', (event) => {
        const data = JSON.parse(event.data);
        const cellKey = resultIdToCellKeyRef.current.get(data.resultId);
        if (!cellKey) return;

        setState((prev) => {
          const newResults = new Map(prev.results);
          const existing = newResults.get(cellKey);
          if (existing) {
            newResults.set(cellKey, {
              ...existing,
              status: 'completed',
              output: data.output,
              latencyMs: data.latencyMs,
            });
          }
          return {
            ...prev,
            results: newResults,
            completedCells: prev.completedCells + 1,
          };
        });
      });

      eventSource.addEventListener('cell_failed', (event) => {
        const data = JSON.parse(event.data);
        const cellKey = resultIdToCellKeyRef.current.get(data.resultId);
        if (!cellKey) return;

        setState((prev) => {
          const newResults = new Map(prev.results);
          const existing = newResults.get(cellKey);
          if (existing) {
            newResults.set(cellKey, {
              ...existing,
              status: 'failed',
              error: data.error,
            });
          }
          return {
            ...prev,
            results: newResults,
            failedCells: prev.failedCells + 1,
          };
        });
      });

      eventSource.addEventListener('run_completed', () => {
        setState((prev) => ({
          ...prev,
          isRunning: false,
        }));
        eventSource.close();
        eventSourceRef.current = null;
        // Invalidate queries to fetch persisted results
        queryClient.invalidateQueries({
          queryKey: getRunsQueryKey(playgroundId),
        });
      });

      eventSource.addEventListener('error', (event) => {
        console.error('SSE error:', event);
        setState((prev) => ({
          ...prev,
          isRunning: false,
        }));
        eventSource.close();
        eventSourceRef.current = null;
      });

      eventSource.onerror = () => {
        setState((prev) => ({
          ...prev,
          isRunning: false,
        }));
        eventSource.close();
        eventSourceRef.current = null;
      };
    } catch (error) {
      console.error('Error starting execution:', error);
      setState((prev) => ({
        ...prev,
        isRunning: false,
      }));
    }
  }, [playgroundId, queryClient]);

  const stopExecution = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isRunning: false,
    }));
  }, []);

  const clearResults = useCallback(() => {
    setState({
      isRunning: false,
      runId: null,
      totalCells: 0,
      completedCells: 0,
      failedCells: 0,
      results: new Map(),
    });
    resultIdToCellKeyRef.current = new Map();
  }, []);

  return {
    ...state,
    startExecution,
    stopExecution,
    clearResults,
  };
}
