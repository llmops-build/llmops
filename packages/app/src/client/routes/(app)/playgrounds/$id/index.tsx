import { createFileRoute } from '@tanstack/react-router';
import { playgroundByIdQueryOptions } from '@client/hooks/queries/usePlaygroundById';
import type { RouterContext } from '@client/routes/__root';
import NewPlaygroundState from './-components/new-playground-state';

export const Route = createFileRoute('/(app)/playgrounds/$id/')({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const ctx = context as RouterContext;
    if (params.id === 'new') {
      return { title: 'New Playground' };
    }

    const playground = await ctx.queryClient.ensureQueryData(
      playgroundByIdQueryOptions(params.id)
    );

    return {
      title: playground?.name ?? params.id,
    };
  },
});

function RouteComponent() {
  const { id } = Route.useParams();
  if (id === 'new') return <NewPlaygroundState />;

  return (
    <div style={{ padding: '24px' }}>
      <p>Playground content will appear here.</p>
    </div>
  );
}
