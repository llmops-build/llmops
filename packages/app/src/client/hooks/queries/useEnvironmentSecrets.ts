import { hc } from '@client/lib/hc';
import { queryOptions, useQuery } from '@tanstack/react-query';

export type EnvironmentSecret = {
  id: string;
  environmentId: string;
  keyName: string;
  keyValue: string;
  createdAt: string;
  updatedAt: string;
};

export const environmentSecretsQueryOptions = (environmentId?: string) =>
  queryOptions({
    queryKey: ['environment-secrets', environmentId],
    queryFn: async () => {
      const response = await hc.v1.environments[':id'].secrets.$get({
        param: { id: environmentId as string },
      });
      const result = await response.json();
      return ('data' in result ? result.data : []) as EnvironmentSecret[];
    },
    enabled: !!environmentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export const useEnvironmentSecrets = (environmentId?: string) => {
  return useQuery(environmentSecretsQueryOptions(environmentId));
};
