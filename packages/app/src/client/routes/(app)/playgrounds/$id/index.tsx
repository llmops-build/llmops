import { createFileRoute } from '@tanstack/react-router';
import {
  playgroundByIdQueryOptions,
  usePlaygroundById,
} from '@client/hooks/queries/usePlaygroundById';
import type { RouterContext } from '@client/routes/__root';
import { Button } from '@ui';
import { Icon } from '@client/components/icons';
import { Plus, Play, MessageSquare } from 'lucide-react';
import NewPlaygroundState from './-components/new-playground-state';
import {
  container,
  toolbar,
  toolbarLeft,
  toolbarRight,
  content,
  infoText,
  emptyState,
  emptyStateTitle,
  emptyStateDescription,
} from './index.css';

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

  if (isLoading) {
    return (
      <div className={emptyState}>
        <p>Loading playground...</p>
      </div>
    );
  }

  if (!playground) {
    return (
      <div className={emptyState}>
        <p>Playground not found.</p>
      </div>
    );
  }

  const promptCount = playground.columns?.length ?? 0;

  return (
    <div className={container}>
      <div className={toolbar}>
        <div className={toolbarLeft}>
          <span className={infoText}>
            {promptCount} {promptCount === 1 ? 'prompt' : 'prompts'}
          </span>
        </div>
        <div className={toolbarRight}>
          <Button variant="outline" scheme="gray">
            <Icon icon={Plus} />
            Add Prompt
          </Button>
          <Button variant="primary" disabled={promptCount === 0}>
            <Icon icon={Play} />
            Run
          </Button>
        </div>
      </div>
      <div className={content}>
        {promptCount === 0 ? (
          <div className={emptyState}>
            <MessageSquare size={48} />
            <h3 className={emptyStateTitle}>No prompts yet</h3>
            <p className={emptyStateDescription}>
              Add your first prompt to start building your playground.
            </p>
            <Button variant="primary">
              <Icon icon={Plus} />
              Add First Prompt
            </Button>
          </div>
        ) : (
          <p>Playground editor will appear here.</p>
        )}
      </div>
    </div>
  );
}

function RouteComponent() {
  const { id } = Route.useParams();
  if (id === 'new') return <NewPlaygroundState />;

  return <PlaygroundContent id={id} />;
}
