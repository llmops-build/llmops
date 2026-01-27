import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '../queries/useDatasets';
import { useNavigate } from '@tanstack/react-router';

export const useCreateDataset = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await hc.v1.datasets.$post({
        json: {
          name: data.name,
        },
      });
      const result = await response.json();
      return 'data' in result ? (result.data as { id: string }) : undefined;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: getQueryKey() });
      if (!data?.id) return;
      navigate({
        to: '/datasets/$id',
        params: { id: data?.id },
      });
    },
  });
};
