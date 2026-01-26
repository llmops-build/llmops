import { hc } from '@client/lib/hc';
import { queryOptions, useQuery } from '@tanstack/react-query';

export type Playground = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export const getQueryKey = (id: string) => ['playground', id];

export const playgroundByIdQueryOptions = (id?: string) =>
  queryOptions({
    queryKey: getQueryKey(id ?? ''),
    queryFn: async () => {
      const response = await hc.v1.playgrounds[':id'].$get({
        param: { id: id as string },
      });
      const result = await response.json();
      return ('data' in result ? result.data : null) as Playground | null;
    },
    enabled: !!id && id !== 'new',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export const usePlaygroundById = (id: string) => {
  return useQuery(playgroundByIdQueryOptions(id));
};
