import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKey } from '../queries/useVariantList';
import { getQueryKey } from '../queries/useVariantById';

export const useDeleteVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await hc.v1.variants[':id'].$delete({
        param: { id },
      });
      const result = await response.json();
      return 'data' in result ? result.data : undefined;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: getQueryKey(id) });
    },
  });
};
