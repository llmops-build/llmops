import { createFileRoute, Outlet } from '@tanstack/react-router';
import { playgroundByIdQueryOptions } from '@client/hooks/queries/usePlaygroundById';
import type { RouterContext } from '@client/routes/__root';

export const Route = createFileRoute('/(app)/playgrounds/$id')({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const ctx = context as RouterContext;
    if (params.id === 'new') {
      return { title: 'New Playground' };
    }

    const playground = await ctx.queryClient.ensureQueryData(
      playgroundByIdQueryOptions(params.id),
    );

    return {
      title: playground?.name ?? params.id,
    };
  },
});

function RouteComponent() {
  return <Outlet />;
}
