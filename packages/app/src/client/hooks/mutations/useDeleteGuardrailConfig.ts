import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getGuardrailConfigsQueryKey } from '../queries/useGuardrailConfigs';

export type DeleteGuardrailConfigInput = {
  id: string;
};

export const useDeleteGuardrailConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeleteGuardrailConfigInput) => {
      const response = await hc.v1.guardrails.configs[':id'].$delete({
        param: { id: data.id },
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
