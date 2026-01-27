import { createFileRoute } from '@tanstack/react-router';
import { datasetByIdQueryOptions } from '@client/hooks/queries/useDatasetById';
import type { RouterContext } from '@client/routes/__root';
import NewDatasetState from './-components/new-dataset-state';

export const Route = createFileRoute('/(app)/datasets/$id/')({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const ctx = context as RouterContext;
    if (params.id === 'new') {
      return { title: 'New Dataset' };
    }

    const dataset = await ctx.queryClient.ensureQueryData(
      datasetByIdQueryOptions(params.id)
    );

    return {
      title: dataset?.name ?? params.id,
    };
  },
});

function RouteComponent() {
  const { id } = Route.useParams();
  if (id === 'new') return <NewDatasetState />;

  // For now, just show a placeholder for existing datasets
  // This can be expanded later with dataset-specific content
  return (
    <div style={{ padding: '24px' }}>
      <p>Dataset content will appear here.</p>
    </div>
  );
}
