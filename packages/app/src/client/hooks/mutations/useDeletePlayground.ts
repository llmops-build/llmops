import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKey } from '../queries/usePlaygrounds';
import { useNavigate } from '@tanstack/react-router';

export const useDeletePlayground = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await hc.v1.playgrounds[':id'].$delete({
        param: { id },
      });
      const result = await response.json();
      return 'data' in result ? result.data : undefined;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKey });
      navigate({ to: '/playgrounds' });
    },
  });
};
