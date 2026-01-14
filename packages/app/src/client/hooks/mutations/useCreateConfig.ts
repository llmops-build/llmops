import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKey } from '../queries/useConfigList';
import { useNavigate } from '@tanstack/react-router';

export const useCreateConfig = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await hc.v1.configs.$post({
        json: {
          name: data.name,
        },
      });
      const result = await response.json();
      return 'data' in result ? (result.data as { id: string }) : undefined;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKey });
      if (!data?.id) return;
      navigate({
        to: '/prompts/$id',
        params: { id: data?.id },
      });
    },
  });
};
