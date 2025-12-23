import { hc } from '@client/lib/hc';
import { queryOptions, useQuery } from '@tanstack/react-query';

export type VariantVersion = {
  id: string;
  variantId: string;
  version: number;
  provider: string;
  modelName: string;
  jsonData: string;
  createdAt: string;
  updatedAt: string;
};

export const getQueryKey = (variantId: string) => [
  'variant-versions',
  variantId,
];

export const variantVersionsQueryOptions = (variantId: string) =>
  queryOptions({
    queryKey: getQueryKey(variantId),
    queryFn: async () => {
      const response = await hc.v1.variants[':id'].versions.$get({
        param: { id: variantId },
      });
      const result = await response.json();
      return ('data' in result ? result.data : []) as VariantVersion[];
    },
    enabled: !!variantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export const useVariantVersions = (variantId: string) => {
  return useQuery(variantVersionsQueryOptions(variantId));
};
