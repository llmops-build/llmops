import { hc } from '@client/lib/hc';
import { queryOptions, useQuery } from '@tanstack/react-query';

export const playgroundByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['playground', id],
    queryFn: async () => {
      const response = await hc.v1.playgrounds[':id'].$get({
        param: { id },
      });
      const result = await response.json();
      return 'data' in result ? result.data : null;
    },
    enabled: !!id && id !== 'new',
  });

export const usePlaygroundById = (id: string) => {
  return useQuery(playgroundByIdQueryOptions(id));
};
