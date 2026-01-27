import { hc } from '@client/lib/hc';
import { queryOptions, useQuery } from '@tanstack/react-query';

export type DatasetVersion = {
  id: string;
  datasetId: string;
  versionNumber: number;
  name: string | null;
  description: string | null;
  recordCount: number;
  snapshotHash: string;
  createdAt: string;
  updatedAt: string;
};

export const getQueryKey = (datasetId: string) => ['dataset-versions', datasetId];

export const datasetVersionsQueryOptions = (
  datasetId: string,
  options?: { limit?: number; offset?: number }
) =>
  queryOptions({
    queryKey: [...getQueryKey(datasetId), options?.limit, options?.offset],
    queryFn: async () => {
      const response = await hc.v1.datasets[':id'].versions.$get({
        param: { id: datasetId },
        query: {
          limit: options?.limit?.toString(),
          offset: options?.offset?.toString(),
        },
      });
      const result = await response.json();
      return ('data' in result ? result.data : []) as DatasetVersion[];
    },
    enabled: !!datasetId && datasetId !== 'new',
  });

export const useDatasetVersions = (
  datasetId: string,
  options?: { limit?: number; offset?: number }
) => {
  return useQuery(datasetVersionsQueryOptions(datasetId, options));
};
