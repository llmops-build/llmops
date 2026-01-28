import { hc } from '@client/lib/hc';
import { queryOptions, useQuery } from '@tanstack/react-query';

export type PlaygroundRun = {
  id: string;
  playgroundId: string;
  datasetId: string | null;
  datasetVersionId: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string | null;
  completedAt: string | null;
  totalRecords: number;
  completedRecords: number;
  createdAt: string;
  updatedAt: string;
};

export const getQueryKey = (playgroundId: string) => [
  'playground-runs',
  playgroundId,
];

export const playgroundRunsQueryOptions = (playgroundId: string) =>
  queryOptions({
    queryKey: getQueryKey(playgroundId),
    queryFn: async () => {
      const response = await hc.v1.playgrounds[':id'].runs.$get({
        param: { id: playgroundId },
      });
      const result = await response.json();
      return ('data' in result ? result.data : []) as PlaygroundRun[];
    },
    enabled: !!playgroundId && playgroundId !== 'new',
  });

export const usePlaygroundRuns = (playgroundId: string) => {
  return useQuery(playgroundRunsQueryOptions(playgroundId));
};
