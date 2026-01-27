import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '../queries/useDatasetRecords';
import { getQueryKey as getDatasetQueryKey } from '../queries/useDatasetById';

export const useCreateDatasetRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      datasetId: string;
      input: Record<string, unknown>;
      expected?: Record<string, unknown> | null;
      metadata?: Record<string, unknown>;
    }) => {
      const response = await hc.v1.datasets[':id'].records.$post({
        param: { id: data.datasetId },
        json: {
          input: data.input,
          expected: data.expected,
          metadata: data.metadata,
        },
      });
      const result = await response.json();
      return 'data' in result ? (result.data as { id: string }) : undefined;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: getQueryKey(variables.datasetId),
      });
      await queryClient.invalidateQueries({
        queryKey: getDatasetQueryKey(variables.datasetId),
      });
    },
  });
};
