import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '../queries/useEnvironments';

export const useDeleteEnvironment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await hc.v1.environments[':id'].$delete({
        param: { id },
      });
      const result = await response.json();
      return 'data' in result ? result.data : undefined;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getQueryKey() });
    },
  });
};
