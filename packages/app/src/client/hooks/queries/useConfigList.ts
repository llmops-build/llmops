import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';

export const queryKey = ['configs-list'];

export const useConfigList = () => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await hc.v1.configs.$get();
      const data = (await response.json()).data;
      return data as {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
      }[];
    },
  });
};
