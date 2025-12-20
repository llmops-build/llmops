import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '../queries/useEnvironments';

export const useUpdateEnvironmentName = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      const response = await hc.v1.environments[':id'].$patch({
        param: {
          id: data.id,
        },
        json: {
          name: data.name,
        },
      });
      const result = await response.json();
      return 'data' in result ? result.data : undefined;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getQueryKey() });
    },
  });
};
