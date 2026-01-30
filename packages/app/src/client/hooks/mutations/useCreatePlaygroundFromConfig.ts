import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hc } from '@client/lib/hc';

type CreatePlaygroundFromConfigInput = {
  configId: string;
  variantId?: string;
  datasetId?: string | null;
  name?: string;
};

type Playground = {
  id: string;
  name: string;
};

export const useCreatePlaygroundFromConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePlaygroundFromConfigInput) => {
      const response = await hc.v1.playgrounds['from-config'].$post({
        json: {
          configId: input.configId,
          variantId: input.variantId,
          datasetId: input.datasetId,
          name: input.name,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          (result as { message?: string }).message ||
            'Failed to create playground'
        );
      }

      return 'data' in result ? (result.data as Playground) : undefined;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playgrounds'] });
    },
  });
};
