import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export type UpsertProviderConfigInput = {
  providerId: string;
  slug?: string | null;
  name?: string | null;
  config: Record<string, unknown>;
  enabled?: boolean;
};

export const useUpsertProviderConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpsertProviderConfigInput) => {
      const response = await hc.v1.providers.configs.$post({
        json: {
          providerId: data.providerId,
          slug: data.slug,
          name: data.name,
          config: data.config,
          enabled: data.enabled,
        },
      });
      const result = await response.json();
      return 'data' in result
        ? (result.data as { id: string; providerId: string })
        : undefined;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['provider-configs'],
      });
    },
  });
};
