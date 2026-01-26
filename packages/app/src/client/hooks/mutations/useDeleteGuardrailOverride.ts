import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getGuardrailOverridesQueryKey } from '../queries/useGuardrailOverrides';

export type DeleteGuardrailOverrideInput = {
  id: string;
  guardrailConfigId: string; // Needed for cache invalidation
};

export const useDeleteGuardrailOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeleteGuardrailOverrideInput) => {
      const response = await hc.v1.guardrails.overrides[':id'].$delete({
        param: { id: data.id },
      });
      const result = await response.json();
      return 'data' in result
        ? (result.data as { id: string; guardrailConfigId: string })
        : undefined;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: getGuardrailOverridesQueryKey(variables.guardrailConfigId),
      });
    },
  });
};
