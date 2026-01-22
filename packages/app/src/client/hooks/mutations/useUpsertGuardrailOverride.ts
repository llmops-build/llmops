import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getGuardrailOverridesQueryKey } from '../queries/useGuardrailOverrides';

export type UpsertGuardrailOverrideInput = {
  guardrailConfigId: string;
  providerConfigId: string;
  enabled?: boolean;
  parameters?: Record<string, unknown> | null;
};

export const useUpsertGuardrailOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpsertGuardrailOverrideInput) => {
      const response = await hc.v1.guardrails.configs[':id'].overrides.$post({
        param: { id: data.guardrailConfigId },
        json: {
          providerConfigId: data.providerConfigId,
          enabled: data.enabled,
          parameters: data.parameters,
        },
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
