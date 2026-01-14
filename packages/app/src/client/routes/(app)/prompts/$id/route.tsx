import { createFileRoute, Outlet } from '@tanstack/react-router';
import { configByIdQueryOptions } from '@client/hooks/queries/useConfigById';
import type { RouterContext } from '@client/routes/__root';

export const Route = createFileRoute('/(app)/prompts/$id')({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const ctx = context as RouterContext;
    if (params.id === 'new') {
      return { title: 'New Prompt' };
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
  return <Outlet />;
}
