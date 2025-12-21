import { createFileRoute } from '@tanstack/react-router';
import { environmentByIdQueryOptions } from '@client/hooks/queries/useEnvironmentById';
import NewEnvironmentState from './-components/new-environment-state';
import SecretsTable from './-components/secrets-table';

export const Route = createFileRoute('/(app)/environments/$environment/')({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    if (params.environment === 'new') {
      return { title: 'New Environment' };
    }

    const environment = await context.queryClient.ensureQueryData(
      environmentByIdQueryOptions(params.environment)
    );

    return {
      title: environment?.name ?? params.environment,
    };
  },
});

function RouteComponent() {
  const { environment } = Route.useParams();
  if (environment === 'new') return <NewEnvironmentState />;

  return <SecretsTable environmentId={environment} />;
}
