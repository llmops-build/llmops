import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';

export const getQueryKey = (id: string) => ['variant', id];

export const useVariantById = (id: string) => {
  return useQuery({
    queryKey: getQueryKey(id),
    queryFn: async () => {
      const response = await hc.v1.variants[':id'].$get({
        param: { id },
      });
      const result = await response.json();
      return ('data' in result ? result.data : null) as {
        id: string;
        provider: string;
        modelName: string;
        jsonData: Record<string, unknown>;
        createdAt: string;
        updatedAt: string;
      } | null;
    },
    enabled: !!id,
  });
};
