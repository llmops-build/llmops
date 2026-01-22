import { hc } from '@client/lib/hc';
import { queryOptions, useQuery } from '@tanstack/react-query';

export type GuardrailConfig = {
  id: string;
  name: string;
  pluginId: string;
  functionId: string;
  hookType: 'beforeRequestHook' | 'afterRequestHook';
  parameters: Record<string, unknown>;
  enabled: boolean;
  priority: number;
  onFail: 'block' | 'log';
  createdAt: string;
  updatedAt: string;
};

export const getGuardrailConfigsQueryKey = () => ['guardrail-configs'];

export const guardrailConfigsQueryOptions = () =>
  queryOptions({
    queryKey: getGuardrailConfigsQueryKey(),
    queryFn: async () => {
      const response = await hc.v1.guardrails.configs.$get();
      const result = await response.json();
      return ('data' in result ? result.data : []) as GuardrailConfig[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export const useGuardrailConfigs = () => {
  return useQuery(guardrailConfigsQueryOptions());
};
