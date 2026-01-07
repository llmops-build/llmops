import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export type DeleteProviderConfigInput = {
  id: string;
};

export const useDeleteProviderConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeleteProviderConfigInput) => {
      const response = await hc.v1.providers.configs[':id'].$delete({
        param: { id: data.id },
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
