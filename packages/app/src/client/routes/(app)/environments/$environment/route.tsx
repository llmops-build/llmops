import { createFileRoute, Outlet } from '@tanstack/react-router';
import { environmentByIdQueryOptions } from '@client/hooks/queries/useEnvironmentById';

export const Route = createFileRoute('/(app)/environments/$environment')({
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
  return <Outlet />;
}
