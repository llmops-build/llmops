import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '../queries/useDatasets';
import { useNavigate } from '@tanstack/react-router';

export const useDeleteDataset = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await hc.v1.datasets[':id'].$delete({
        param: { id },
      });
      const result = await response.json();
      return 'data' in result ? (result.data as { id: string }) : undefined;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: getQueryKey() });
      navigate({ to: '/datasets' });
    },
  });
};
