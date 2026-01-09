import { createFileRoute, Navigate } from '@tanstack/react-router';
import { configByIdQueryOptions } from '@client/hooks/queries/useConfigById';
import type { RouterContext } from '@client/routes/__root';
import NewConfigState from './-components/new-config-state';

export const Route = createFileRoute('/(app)/configs/$id/')({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const ctx = context as RouterContext;
    if (params.id === 'new') {
      return { title: 'New Config' };
    }

    const config = await ctx.queryClient.ensureQueryData(
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
