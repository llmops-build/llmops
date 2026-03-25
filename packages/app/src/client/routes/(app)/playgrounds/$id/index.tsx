import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  playgroundByIdQueryOptions,
  usePlaygroundById,
} from '@client/hooks/queries/usePlaygroundById';
import { useUpdatePlayground } from '@client/hooks/mutations/useUpdatePlayground';
import { usePlaygroundExecution } from '@client/hooks/usePlaygroundExecution';
import type { RouterContext } from '@client/routes/__root';
import type { PlaygroundColumn } from '@llmops/core';
import { Button } from '@ui';
import { Icon } from '@client/components/icons';
import { Plus, Play, Square } from 'lucide-react';
import NewPlaygroundState from './-components/new-playground-state';
import PromptColumn from './-components/prompt-column';
import DatasetResultsSection from './-components/dataset-results-section';
import {
  container,
  toolbar,
  toolbarLeft,
  toolbarRight,
  content,
  infoText,
  emptyState,
  promptsContainer,
  addColumnButton,
} from './index.css';

export const Route = createFileRoute('/(app)/playgrounds/$id/')({
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

function createEmptyColumn(position: number): PlaygroundColumn {
  return {
    id: uuidv4(),
    name: position === 0 ? 'Base prompt' : `Prompt ${position + 1}`,
    position,
    providerConfigId: null,
    modelName: '',
    messages: [{ role: 'system', content: 'You are a helpful assistant' }],
    temperature: null,
    maxTokens: null,
    topP: null,
    frequencyPenalty: null,
    presencePenalty: null,
  };
}

type SaveStatus = 'idle' | 'saving' | 'saved';

function PlaygroundContent({ id }: { id: string }) {
  const { data: playground, isLoading } = usePlaygroundById(id);
  const updatePlayground = useUpdatePlayground();
  const execution = usePlaygroundExecution(id);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [localColumns, setLocalColumns] = useState<PlaygroundColumn[] | null>(
    null,
  );
  const [localDatasetId, setLocalDatasetId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Configure dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Derive columns from local state or server data
  let columns: PlaygroundColumn[];
  if (localColumns !== null) {
    columns = localColumns;
  } else if (!playground?.columns || playground.columns.length === 0) {
    columns = [createEmptyColumn(0)];
  } else {
    columns = playground.columns;
  }

  // Derive datasetId from local state or server data
  const datasetId = localDatasetId ?? playground?.datasetId ?? null;

  // Sync local state when server data changes (initial load)
  useEffect(() => {
    if (playground?.columns && localColumns === null) {
      const cols =
        playground.columns.length === 0
          ? [createEmptyColumn(0)]
          : playground.columns;
      setLocalColumns(cols);
    }
    if (playground?.datasetId !== undefined && localDatasetId === null) {
      setLocalDatasetId(playground.datasetId);
    }
  }, [
    playground?.columns,
    playground?.datasetId,
    localColumns,
    localDatasetId,
  ]);

  const savePlayground = (data: {
    columns?: PlaygroundColumn[];
    datasetId?: string | null;
  }) => {
    setSaveStatus('saving');
    updatePlayground.mutate(
      { id, ...data },
      {
        onSuccess: () => {
          setSaveStatus('saved');
          // Clear any existing saved timeout
          if (savedTimeoutRef.current) {
            clearTimeout(savedTimeoutRef.current);
          }
          // Reset to idle after 2 seconds
          savedTimeoutRef.current = setTimeout(() => {
            setSaveStatus('idle');
          }, 2000);
        },
        onError: () => {
          setSaveStatus('idle');
        },
      },
    );
  };

  const handleColumnsChange = (newColumns: PlaygroundColumn[]) => {
    // Update local state immediately
    setLocalColumns(newColumns);

    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the save by 2 seconds
    debounceRef.current = setTimeout(() => {
      savePlayground({ columns: newColumns });
    }, 2000);
  };

  const handleDatasetChange = (newDatasetId: string | null) => {
    setLocalDatasetId(newDatasetId);

    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the save by 2 seconds
    debounceRef.current = setTimeout(() => {
      savePlayground({ datasetId: newDatasetId });
    }, 2000);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  const handleColumnChange = (
    index: number,
    updatedColumn: PlaygroundColumn,
  ) => {
    const newColumns = [...columns];
    newColumns[index] = updatedColumn;
    handleColumnsChange(newColumns);
  };

  const handleAddColumn = () => {
    const newColumn = createEmptyColumn(columns.length);
    handleColumnsChange([...columns, newColumn]);
  };

  const handleDeleteColumn = (index: number) => {
    if (columns.length <= 1) return;
    const newColumns = columns.filter((_, i) => i !== index);
    // Update positions
    newColumns.forEach((col, i) => {
      col.position = i;
    });
    handleColumnsChange(newColumns);
  };

  const handleDuplicateColumn = (index: number) => {
    const columnToDuplicate = columns[index];
    const newColumn: PlaygroundColumn = {
      ...columnToDuplicate,
      id: uuidv4(),
      name: `${columnToDuplicate.name} (copy)`,
      position: columns.length,
      // Don't copy source tracking - duplicated column is independent
      configId: null,
      variantId: null,
      variantVersionId: null,
    };
    handleColumnsChange([...columns, newColumn]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex((col) => col.id === active.id);
      const newIndex = columns.findIndex((col) => col.id === over.id);

      const reorderedColumns = arrayMove(columns, oldIndex, newIndex);
      // Update positions after reorder
      reorderedColumns.forEach((col, i) => {
        col.position = i;
      });
      handleColumnsChange(reorderedColumns);
    }
  };

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

  const promptCount = columns.length;

  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      default:
        return `${promptCount} ${promptCount === 1 ? 'prompt' : 'prompts'}`;
    }
  };

  return (
    <div className={container}>
      <div className={toolbar}>
        <div className={toolbarLeft}>
          <span className={infoText}>{getStatusText()}</span>
        </div>
        <div className={toolbarRight}>
          {execution.isRunning ? (
            <Button
              variant="outline"
              scheme="gray"
              onClick={execution.stopExecution}
            >
              <Icon icon={Square} />
              Stop
            </Button>
          ) : (
            <Button variant="primary" onClick={execution.startExecution}>
              <Icon icon={Play} />
              Run
            </Button>
          )}
        </div>
      </div>
      <div className={content}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map((col) => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className={promptsContainer}>
              {columns.map((column, index) => (
                <PromptColumn
                  key={column.id}
                  column={column}
                  onChange={(updated) => handleColumnChange(index, updated)}
                  onDelete={() => handleDeleteColumn(index)}
                  onDuplicate={() => handleDuplicateColumn(index)}
                  canDelete={columns.length > 1}
                />
              ))}
              <button
                type="button"
                className={addColumnButton}
                onClick={handleAddColumn}
                title="Add prompt"
              >
                <Plus size={20} />
              </button>
            </div>
          </SortableContext>
        </DndContext>
      </div>
      <DatasetResultsSection
        playgroundId={id}
        datasetId={datasetId}
        onDatasetChange={handleDatasetChange}
        columns={columns}
        executionResults={execution.results}
        isExecuting={execution.isRunning}
      />
    </div>
  );
}

function RouteComponent() {
  const { id } = Route.useParams();
  if (id === 'new') return <NewPlaygroundState />;

  return <PlaygroundContent id={id} />;
}
