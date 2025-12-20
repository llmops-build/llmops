import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authQueryKey } from '../queries/useAuthMe';

/**
 * Hook to logout the current user
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await hc.v1.auth.logout.$post();

      if (!response.ok) {
        const error = await response.json();
        throw new Error('message' in error ? error.message : 'Logout failed');
      }

      return true;
    },
    onSuccess: () => {
      // Clear all cached data and redirect to login
      queryClient.clear();
      // The auth check in the router will redirect to login
      queryClient.invalidateQueries({ queryKey: authQueryKey });
    },
  });
};
