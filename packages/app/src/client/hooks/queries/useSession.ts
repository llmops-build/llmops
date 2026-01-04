import { useQuery } from '@tanstack/react-query';
import { authClient } from '@client/lib/auth';

export const getSessionQueryKey = () => ['session'];

export const useSession = () => {
  return useQuery({
    queryKey: getSessionQueryKey(),
    queryFn: async () => {
      const session = await authClient.getSession();
      return session.data;
    },
    staleTime: 1000 * 60, // Cache for 1 minute
    retry: false, // Don't retry on auth errors
  });
};
