import { hc } from '@client/lib/hc';
import { queryOptions, useQuery } from '@tanstack/react-query';

export type GuardrailOverride = {
  id: string;
  providerConfigId: string;
  guardrailConfigId: string;
  enabled: boolean;
  parameters: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export const getGuardrailOverridesQueryKey = (guardrailConfigId: string) => [
  'guardrail-overrides',
  guardrailConfigId,
];

export const guardrailOverridesQueryOptions = (guardrailConfigId: string) =>
  queryOptions({
    queryKey: getGuardrailOverridesQueryKey(guardrailConfigId),
    queryFn: async () => {
      const response = await hc.v1.guardrails.configs[':id'].overrides.$get({
        param: { id: guardrailConfigId },
      });
      const result = await response.json();
      return ('data' in result ? result.data : []) as GuardrailOverride[];
    },
    enabled: !!guardrailConfigId,
  });

export const useGuardrailOverrides = (guardrailConfigId: string) => {
  return useQuery(guardrailOverridesQueryOptions(guardrailConfigId));
};
