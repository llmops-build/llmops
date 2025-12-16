import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';

export const queryKey = ['variants-list'];

export const useVariantList = () => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await hc.v1.variants.$get();
      const data = (await response.json()).data;
      return data as {
        id: string;
        provider: string;
        modelName: string;
        jsonData: Record<string, unknown>;
        createdAt: string;
        updatedAt: string;
      }[];
    },
  });
};
