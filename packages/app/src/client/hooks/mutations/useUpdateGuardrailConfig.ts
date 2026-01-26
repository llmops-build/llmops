import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getGuardrailConfigsQueryKey } from '../queries/useGuardrailConfigs';

export type UpdateGuardrailConfigInput = {
  id: string;
  name?: string;
  hookType?: 'beforeRequestHook' | 'afterRequestHook';
  parameters?: Record<string, unknown>;
  enabled?: boolean;
  priority?: number;
  onFail?: 'block' | 'log';
};

export const useUpdateGuardrailConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateGuardrailConfigInput) => {
      const response = await hc.v1.guardrails.configs[':id'].$patch({
        param: { id: data.id },
        json: {
          name: data.name,
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
