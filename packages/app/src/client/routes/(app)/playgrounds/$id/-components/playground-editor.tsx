import { useState, useCallback, useRef, useEffect } from 'react';
import type { PlaygroundColumn } from '@llmops/core';
import { Plus, Play, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import PlaygroundColumnComponent from './playground-column';
import DatasetSelector from './dataset-selector';
import ResultsGrid from './results-grid';
import { useExecutePlayground } from '@client/hooks/mutations/useExecutePlayground';
import * as styles from './playground-editor.css';

type PlaygroundEditorProps = {
  playgroundId: string;
  columns: PlaygroundColumn[] | null;
  datasetId: string | null;
  onColumnsChange: (columns: PlaygroundColumn[]) => void;
  onDatasetChange: (datasetId: string | null) => void;
};

const createDefaultColumn = (position: number): PlaygroundColumn => ({
  id: uuidv4(),
  name: `Column ${position + 1}`,
  position,
  providerConfigId: '',
  modelName: '',
  messages: [
    { role: 'system', content: '' },
    { role: 'user', content: '' },
  ],
  temperature: null,
  maxTokens: null,
  topP: null,
  frequencyPenalty: null,
  presencePenalty: null,
});

export function PlaygroundEditor({
  playgroundId,
  columns: initialColumns,
  datasetId,
  onColumnsChange,
  onDatasetChange,
}: PlaygroundEditorProps) {
  const [columns, setColumns] = useState<PlaygroundColumn[]>(
    initialColumns ?? [createDefaultColumn(0)]
  );
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  // Sync with props when they change (e.g., after save)
  useEffect(() => {
    if (initialColumns) {
      setColumns(initialColumns);
    }
  }, [initialColumns]);

  const { execute, executionState, isStarting, stopExecution } =
    useExecutePlayground(playgroundId);

  const handleAddColumn = useCallback(() => {
    const newColumn = createDefaultColumn(columnsRef.current.length);
    const updatedColumns = [...columnsRef.current, newColumn];
    setColumns(updatedColumns);
    onColumnsChange(updatedColumns);
  }, [onColumnsChange]);

  const handleDeleteColumn = useCallback(
    (columnId: string) => {
      if (columnsRef.current.length <= 1) return; // Keep at least one column
      const updatedColumns = columnsRef.current
        .filter((c) => c.id !== columnId)
        .map((c, i) => ({ ...c, position: i }));
      setColumns(updatedColumns);
      onColumnsChange(updatedColumns);
    },
    [onColumnsChange]
  );

  const handleColumnChange = useCallback(
    (columnId: string, updates: Partial<PlaygroundColumn>) => {
      const updatedColumns = columnsRef.current.map((c) =>
        c.id === columnId ? { ...c, ...updates } : c
      );
      setColumns(updatedColumns);
      onColumnsChange(updatedColumns);
    },
    [onColumnsChange]
  );

  const canRun = columns.every(
    (c) => c.providerConfigId && c.modelName && c.messages.length > 0
  );

  return (
    <div className={styles.editorContainer}>
      <div className={styles.toolbar}>
        <DatasetSelector
          selectedDatasetId={datasetId}
          onSelect={onDatasetChange}
        />
        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={styles.runButton}
            onClick={executionState.isRunning ? stopExecution : execute}
            disabled={!canRun || isStarting}
          >
            {isStarting || executionState.isRunning ? (
              <>
                <Loader2 size={16} className={styles.spinnerIcon} />
                {executionState.isRunning ? 'Running...' : 'Starting...'}
              </>
            ) : (
              <>
                <Play size={16} />
                Run
              </>
            )}
          </button>
        </div>
      </div>

      <div className={styles.columnsContainer}>
        {columns.map((column) => (
          <PlaygroundColumnComponent
            key={column.id}
            column={column}
            onChange={(updates) => handleColumnChange(column.id, updates)}
            onDelete={() => handleDeleteColumn(column.id)}
            canDelete={columns.length > 1}
          />
        ))}
        <button
          type="button"
          className={styles.addColumnButton}
          onClick={handleAddColumn}
        >
          <Plus size={20} />
          <span>Add Column</span>
        </button>
      </div>

      {executionState.runId && (
        <ResultsGrid
          columns={columns}
          executionState={executionState}
          playgroundId={playgroundId}
        />
      )}
    </div>
  );
}

export default PlaygroundEditor;
