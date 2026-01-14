import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';

export const queryKey = ['playgrounds-list'];

export const usePlaygrounds = () => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await hc.v1.playgrounds.$get();
      const data = (await response.json()).data;
      return data;
    },
  });
};
