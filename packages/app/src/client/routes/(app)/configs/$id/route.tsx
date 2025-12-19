import { createFileRoute, Outlet } from '@tanstack/react-router';
import { configByIdQueryOptions } from '@client/hooks/queries/useConfigById';

export const Route = createFileRoute('/(app)/configs/$id')({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    if (params.id === 'new') {
      return { title: 'New Config' };
    }

    const config = await context.queryClient.ensureQueryData(
      configByIdQueryOptions(params.id)
    );

    return {
      title: config?.name ?? params.id,
    };
  },
});

function RouteComponent() {
  return <Outlet />;
}
