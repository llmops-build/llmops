import { hc } from '@client/lib/hc';
import { queryOptions, useQuery } from '@tanstack/react-query';

export type Variant = {
  id: string;
  name: string;
  provider: string;
  modelName: string;
  jsonData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export const variantByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['variant', id],
    queryFn: async () => {
      const response = await hc.v1.variants[':id'].$get({
        param: { id },
      });
      const result = await response.json();
      return ('data' in result ? result.data : null) as Variant | null;
    },
    enabled: !!id,
  });

export const useVariantById = (id: string) => {
  return useQuery(variantByIdQueryOptions(id));
};
