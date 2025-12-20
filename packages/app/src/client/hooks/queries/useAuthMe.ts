import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';

export const authQueryKey = ['auth', 'me'];

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'member' | 'viewer';
  teamId?: string;
  isActive: boolean;
}

export interface AuthMeResponse {
  user: AuthUser;
  session: {
    expiresAt: string;
  };
}

/**
 * Hook to get the current authenticated user
 */
export const useAuthMe = () => {
  return useQuery({
    queryKey: authQueryKey,
    queryFn: async (): Promise<AuthMeResponse | null> => {
      try {
        const response = await hc.v1.auth.me.$get();
        if (!response.ok) {
          return null;
        }
        const result = await response.json();
        if ('data' in result && result.data) {
          return result.data as AuthMeResponse;
        }
        return null;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};
