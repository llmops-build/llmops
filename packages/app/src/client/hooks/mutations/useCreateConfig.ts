import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKey } from '../queries/useConfigList';

export const useCreateConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await hc.v1.configs.$post({
        json: {
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
