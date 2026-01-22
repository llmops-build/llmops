import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getGuardrailConfigsQueryKey } from '../queries/useGuardrailConfigs';

export type CreateGuardrailConfigInput = {
  name: string;
  pluginId: string;
  functionId: string;
  hookType: 'beforeRequestHook' | 'afterRequestHook';
  parameters?: Record<string, unknown>;
  enabled?: boolean;
  priority?: number;
  onFail?: 'block' | 'log';
};

export const useCreateGuardrailConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGuardrailConfigInput) => {
      const response = await hc.v1.guardrails.configs.$post({
        json: {
          name: data.name,
          pluginId: data.pluginId,
          functionId: data.functionId,
          hookType: data.hookType,
          parameters: data.parameters,
          enabled: data.enabled,
          priority: data.priority,
          onFail: data.onFail,
        },
      });
      const result = await response.json();
      return 'data' in result
        ? (result.data as { id: string; name: string })
        : undefined;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getGuardrailConfigsQueryKey(),
      });
    },
  });
};
