import { hc } from '@client/lib/hc';
import { queryOptions, useQuery } from '@tanstack/react-query';

export type PlaygroundResult = {
  id: string;
  runId: string;
  columnId: string;
  datasetRecordId: string | null;
  inputVariables: Record<string, unknown>;
  outputContent: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error: string | null;
  latencyMs: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  cost: number | null;
  createdAt: string;
  updatedAt: string;
};

export const getQueryKey = (playgroundId: string, runId: string) => [
  'playground-results',
  playgroundId,
  runId,
];

export const playgroundResultsQueryOptions = (
  playgroundId: string,
  runId: string,
) =>
  queryOptions({
    queryKey: getQueryKey(playgroundId, runId),
    queryFn: async () => {
      const response = await hc.v1.playgrounds[':id'].runs[
        ':runId'
      ].results.$get({
        param: { id: playgroundId, runId },
      });
      const result = await response.json();
      return ('data' in result ? result.data : []) as PlaygroundResult[];
    },
    enabled: !!playgroundId && !!runId && playgroundId !== 'new',
  });

export const usePlaygroundResults = (playgroundId: string, runId: string) => {
  return useQuery(playgroundResultsQueryOptions(playgroundId, runId));
};
