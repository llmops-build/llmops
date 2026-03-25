import { createFileRoute } from '@tanstack/react-router';
import { datasetByIdQueryOptions } from '@client/hooks/queries/useDatasetById';
import type { RouterContext } from '@client/routes/__root';
import NewDatasetState from './-components/new-dataset-state';
import { DatasetRecordsTable } from './-components/dataset-records-table';

export const Route = createFileRoute('/(app)/datasets/$id/')({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const ctx = context as RouterContext;
    if (params.id === 'new') {
      return { title: 'New Dataset' };
    }

    const dataset = await ctx.queryClient.ensureQueryData(
      datasetByIdQueryOptions(params.id),
    );

    return {
      title: dataset?.name ?? params.id,
    };
  },
});

function RouteComponent() {
  const { id } = Route.useParams();

  if (id === 'new') return <NewDatasetState />;

  return <DatasetRecordsTable datasetId={id} />;
}
