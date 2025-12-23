import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey as getVariantVersionsQueryKey } from '../queries/useVariantVersions';

type VariantVersionResult = {
  id: string;
  variantId: string;
  version: number;
  provider: string;
  modelName: string;
  jsonData: string;
  createdAt: string;
  updatedAt: string;
};

export const useCreateVariantVersion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      variantId: string;
      provider: string;
      modelName: string;
      jsonData?: Record<string, unknown>;
    }): Promise<VariantVersionResult | undefined> => {
      const response = await hc.v1.variants[':id'].versions.$post({
        param: { id: data.variantId },
        json: {
          provider: data.provider,
          modelName: data.modelName,
          jsonData: data.jsonData,
        },
      });
      const result = await response.json();
      if (!response.ok || !('data' in result)) {
        throw new Error(
          'message' in result
            ? (result.message as string)
            : 'Failed to create variant version'
        );
      }
      return result.data as VariantVersionResult;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: getVariantVersionsQueryKey(variables.variantId),
      });
      // Also invalidate variant queries since latest version may have changed
      queryClient.invalidateQueries({
        queryKey: ['variant', variables.variantId],
      });
    },
  });
};
