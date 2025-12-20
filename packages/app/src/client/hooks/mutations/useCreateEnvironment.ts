import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '../queries/useEnvironments';
import { useNavigate } from '@tanstack/react-router';

export const useCreateEnvironment = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; isProd?: boolean }) => {
      // Auto-generate slug from name
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const response = await hc.v1.environments.$post({
        json: {
          name: data.name,
          slug,
          isProd: data.isProd,
        },
      });
      const result = await response.json();
      return 'data' in result ? (result.data as { id: string }) : undefined;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: getQueryKey() });
      if (!data?.id) return;
      navigate({
        to: '/environments/$id',
        params: { id: data?.id },
      });
    },
  });
};
