import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKey } from '../queries/usePlaygrounds';
import { useNavigate } from '@tanstack/react-router';

export const useCreatePlayground = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      state?: Record<string, unknown>;
    }) => {
      const response = await hc.v1.playgrounds.$post({
        json: {
          name: data.name,
          description: data.description,
          state: data.state,
        },
      });
      const result = await response.json();
      return 'data' in result ? (result.data as { id: string }) : undefined;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKey });
      if (!data?.id) return;
      // TODO: Update to '/playgrounds/$id' once the route is created
      // For now navigating to list or handling it in the component might be safer if the route is missing
      // But assuming the route will be created shortly or already exists as a placeholder
      navigate({
        to: '/playgrounds',
        // params: { id: data?.id },
      });
    },
  });
};
