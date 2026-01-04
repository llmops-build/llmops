import {
  type QueryClient,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';
import { authClient } from '@client/lib/auth';

export const SESSION_QUERY_KEY = ['session'];

const queryFn = async () => {
  const { data } = await authClient.getSession();
  return data?.session ?? null;
};

export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: SESSION_QUERY_KEY,
    queryFn,
    staleTime: 5 * 60 * 1000,
  });

export const getSession = async (queryClient: QueryClient) => {
  return queryClient.fetchQuery(sessionQueryOptions());
};

export const useSession = () => {
  return useQuery(sessionQueryOptions());
};
