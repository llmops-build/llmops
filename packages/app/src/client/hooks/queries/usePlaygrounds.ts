import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';

export const getQueryKey = () => ['playgrounds'];

export const usePlaygrounds = () => {
  return useQuery({
    queryKey: getQueryKey(),
    queryFn: async () => {
      const response = await hc.v1.playgrounds.$get();
      const result = await response.json();
      return ('data' in result ? result.data : []) as {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
      }[];
    },
  });
};
