import { hc } from '@client/lib/hc';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { type Dataset } from './useDatasets';

export const getQueryKey = (id: string) => ['dataset', id];

export const datasetByIdQueryOptions = (id?: string) =>
  queryOptions({
    queryKey: getQueryKey(id ?? ''),
    queryFn: async () => {
      const response = await hc.v1.datasets[':id'].$get({
        param: { id: id as string },
      });
      const result = await response.json();
      return ('data' in result ? result.data : null) as Dataset | null;
    },
    enabled: !!id && id !== 'new',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export const useDatasetById = (id: string) => {
  return useQuery(datasetByIdQueryOptions(id));
};
