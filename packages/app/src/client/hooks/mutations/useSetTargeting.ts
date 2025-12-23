import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey as getTargetingRulesQueryKey } from '../queries/useTargetingRules';

export const useSetTargeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      environmentId: string;
      configId: string;
      configVariantId: string;
      variantVersionId: string; // Required - explicit version deployment
    }) => {
      const response = await hc.v1.targeting.set.$post({
        json: {
          environmentId: data.environmentId,
          configId: data.configId,
          configVariantId: data.configVariantId,
          variantVersionId: data.variantVersionId,
        },
      });
      const result = await response.json();
      if (!response.ok || !('data' in result)) {
        throw new Error(
          'message' in result
            ? (result.message as string)
            : 'Failed to set targeting'
        );
      }
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: getTargetingRulesQueryKey(variables.configId),
      });
    },
  });
};
