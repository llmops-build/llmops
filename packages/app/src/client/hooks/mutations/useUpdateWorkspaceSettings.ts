import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey as getWorkspaceSettingsQueryKey } from '../queries/useWorkspaceSettings';

export const useUpdateWorkspaceSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string | null }) => {
      const response = await hc.v1['workspace-settings'].$patch({
        json: {
          name: data.name,
        },
      });
      const result = await response.json();
      if (!response.ok || !('data' in result)) {
        throw new Error(
          'message' in result
            ? (result.message as string)
            : 'Failed to update workspace settings'
        );
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getWorkspaceSettingsQueryKey(),
      });
    },
  });
};
