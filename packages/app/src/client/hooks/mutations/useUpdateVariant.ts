import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKey } from '../queries/useVariantList';
import { getQueryKey } from '../queries/useVariantById';
import { getQueryKey as getConfigVariantsQueryKey } from '../queries/useConfigVariants';

export const useUpdateVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      provider?: string;
      modelName?: string;
      jsonData?: Record<string, unknown>;
    }) => {
      const { id, ...updates } = data;
      const response = await hc.v1.variants[':id'].$patch({
        param: { id },
        json: updates,
      });
      const result = await response.json();
      return 'data' in result ? result.data : undefined;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: getQueryKey(variables.id) });
    },
  });
};
