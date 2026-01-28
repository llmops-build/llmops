import { createFileRoute } from '@tanstack/react-router';
import {
  playgroundByIdQueryOptions,
  usePlaygroundById,
} from '@client/hooks/queries/usePlaygroundById';
import { useUpdatePlayground } from '@client/hooks/mutations/useUpdatePlayground';
import type { RouterContext } from '@client/routes/__root';
import type { PlaygroundColumn } from '@llmops/core';
import { useCallback } from 'react';
import NewPlaygroundState from './-components/new-playground-state';
import PlaygroundEditor from './-components/playground-editor';

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

function PlaygroundContent({ id }: { id: string }) {
  const { data: playground, isLoading } = usePlaygroundById(id);
  const updatePlayground = useUpdatePlayground();

  const handleColumnsChange = useCallback(
    (columns: PlaygroundColumn[]) => {
      updatePlayground.mutate({ id, columns });
    },
    [id, updatePlayground]
  );

  const handleDatasetChange = useCallback(
    (datasetId: string | null) => {
      updatePlayground.mutate({ id, datasetId });
    },
    [id, updatePlayground]
  );

  if (isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <p>Loading playground...</p>
      </div>
    );
  }

  if (!playground) {
    return (
      <div style={{ padding: '24px' }}>
        <p>Playground not found.</p>
      </div>
    );
  }

  return (
    <PlaygroundEditor
      playgroundId={id}
      columns={playground.columns}
      datasetId={playground.datasetId}
      onColumnsChange={handleColumnsChange}
      onDatasetChange={handleDatasetChange}
    />
  );
}

function RouteComponent() {
  const { id } = Route.useParams();
  if (id === 'new') return <NewPlaygroundState />;

  return <PlaygroundContent id={id} />;
}
