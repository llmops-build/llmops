import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export type UpdateProviderConfigInput = {
  id: string;
  name?: string | null;
  config?: Record<string, unknown>;
  enabled?: boolean;
};

export const useUpdateProviderConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProviderConfigInput) => {
      const response = await hc.v1.providers.configs[':id'].$patch({
        param: { id: data.id },
        json: {
          name: data.name,
          config: data.config,
          enabled: data.enabled,
        },
      });
      const result = await response.json();
      return 'data' in result
        ? (result.data as {
            id: string;
            providerId: string;
          })
        : undefined;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['provider-configs'],
      });
    },
  });
};
