import { hc } from '@client/lib/hc';
import { queryOptions, useQuery } from '@tanstack/react-query';

export type DatasetRecord = {
  id: string;
  datasetId: string;
  input: string;
  expected: string | null;
  metadata: string;
  createdAt: string;
  updatedAt: string;
};

export const getQueryKey = (datasetId: string) => ['dataset-records', datasetId];

export const datasetRecordsQueryOptions = (
  datasetId: string,
  options?: { limit?: number; offset?: number }
) =>
  queryOptions({
    queryKey: [...getQueryKey(datasetId), options?.limit, options?.offset],
    queryFn: async () => {
      const response = await hc.v1.datasets[':id'].records.$get({
        param: { id: datasetId },
        query: {
          limit: options?.limit?.toString(),
          offset: options?.offset?.toString(),
        },
      });
      const result = await response.json();
      return ('data' in result ? result.data : []) as DatasetRecord[];
    },
    enabled: !!datasetId && datasetId !== 'new',
  });

export const useDatasetRecords = (
  datasetId: string,
  options?: { limit?: number; offset?: number }
) => {
  return useQuery(datasetRecordsQueryOptions(datasetId, options));
};
