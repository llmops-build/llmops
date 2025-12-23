import { hc } from '@client/lib/hc';
import { queryOptions, useQuery } from '@tanstack/react-query';

export type Config = {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export const configByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['config', id],
    queryFn: async () => {
      const response = await hc.v1.configs[':id'].$get({
        param: { id },
      });
      const result = await response.json();
      return ('data' in result ? result.data : null) as Config | null;
    },
    enabled: !!id && id !== 'new',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export const useConfigById = (id: string) => {
  return useQuery(configByIdQueryOptions(id));
};
