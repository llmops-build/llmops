import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authQueryKey } from '../queries/useAuthMe';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    role: 'admin' | 'member' | 'viewer';
  };
  expiresAt: string;
}

/**
 * Hook to login a user
 */
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      credentials: LoginCredentials
    ): Promise<LoginResponse> => {
      const response = await hc.v1.auth.login.$post({
        json: credentials,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error('message' in error ? error.message : 'Login failed');
      }

      const result = await response.json();
      if ('data' in result && result.data) {
        return result.data as LoginResponse;
      }
      throw new Error('Invalid response from server');
    },
    onSuccess: () => {
      // Invalidate auth query to refetch user data
      queryClient.invalidateQueries({ queryKey: authQueryKey });
    },
  });
};
