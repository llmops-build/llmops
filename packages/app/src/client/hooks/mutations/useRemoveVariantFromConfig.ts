import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '../queries/useConfigVariants';

export const useRemoveVariantFromConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { configId: string; variantId: string }) => {
      const { configId, variantId } = data;
      const response = await hc.v1.configs[':configId'].variants[
        ':variantId'
      ].$delete({
        param: { configId, variantId },
      });
      const result = await response.json();
      return 'data' in result ? result.data : undefined;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: getQueryKey(variables.configId),
      });
    },
  });
};
