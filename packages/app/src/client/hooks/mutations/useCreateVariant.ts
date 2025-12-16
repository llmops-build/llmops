import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKey } from '../queries/useVariantList';

export const useCreateVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      provider: string;
      modelName: string;
      jsonData?: Record<string, unknown>;
    }) => {
      const response = await hc.v1.variants.$post({
        json: data,
      });
      const result = await response.json();
      return 'data' in result ? result.data : undefined;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
