import { createFileRoute, Navigate } from '@tanstack/react-router';
import { configByIdQueryOptions } from '@client/hooks/queries/useConfigById';
import NewConfigState from './-components/new-config-state';

export const Route = createFileRoute('/(app)/configs/$id/')({
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
  const { id } = Route.useParams();
  if (id === 'new') return <NewConfigState />;

  return (
    <Navigate
      to="/configs/$id/variants"
      params={{
        id,
      }}
      replace
    />
  );
}
