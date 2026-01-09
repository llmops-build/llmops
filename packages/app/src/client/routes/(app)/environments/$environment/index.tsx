import { createFileRoute, Navigate } from '@tanstack/react-router';
import { environmentByIdQueryOptions } from '@client/hooks/queries/useEnvironmentById';
import type { RouterContext } from '@client/routes/__root';
import NewEnvironmentState from './-components/new-environment-state';

export const Route = createFileRoute('/(app)/environments/$environment/')({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const ctx = context as RouterContext;
    if (params.environment === 'new') {
      return { title: 'New Environment' };
    }

    const environment = await ctx.queryClient.ensureQueryData(
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

  return (
    <Navigate
      to="/environments/$environment/secrets"
      params={{
        environment,
      }}
      replace
    />
  );
}
