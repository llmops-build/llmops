import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '../queries/usePlaygrounds';
import { useNavigate } from '@tanstack/react-router';

export const useCreatePlayground = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await hc.v1.playgrounds.$post({
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
        to: '/playgrounds/$id',
        params: { id: data?.id },
      });
    },
  });
};
