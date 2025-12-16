import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKey } from '../queries/useConfigList';

export const useUpdateConfigName = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      const response = await hc.v1.configs[':id'].$patch({
        param: {
          id: data.id,
        },
        form: {
          name: data.name,
        },
      });
      const result = await response.json();
      return 'data' in result ? result.data : undefined;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });
};
