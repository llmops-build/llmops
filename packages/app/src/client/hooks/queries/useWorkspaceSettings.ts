import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';

export const getQueryKey = () => ['workspace-settings'];

export const useWorkspaceSettings = () => {
  return useQuery({
    queryKey: getQueryKey(),
    queryFn: async () => {
      const response = await hc.v1['workspace-settings'].$get();
      const result = await response.json();
      const data = 'data' in result ? result.data : null;
      return data as {
        id: string;
        name: string | null;
        createdAt: string;
        updatedAt: string;
      } | null;
    },
  });
};
