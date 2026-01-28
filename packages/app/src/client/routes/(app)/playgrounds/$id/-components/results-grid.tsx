import type { PlaygroundColumn } from '@llmops/core';
import type { ExecutionState, CellState } from '@client/hooks/mutations/useExecutePlayground';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import * as styles from './results-grid.css';

type ResultsGridProps = {
  columns: PlaygroundColumn[];
  executionState: ExecutionState;
  playgroundId: string;
};

type OutputCellProps = {
  cell: CellState | undefined;
  isRunning: boolean;
};

function OutputCell({ cell, isRunning }: OutputCellProps) {
  if (!cell) {
    return (
      <div className={styles.cellPending}>
        <Clock size={14} />
        <span>Pending</span>
      </div>
    );
  }

  if (cell.status === 'running') {
    return (
      <div className={styles.cellContent}>
        <div className={styles.cellHeader}>
          <Loader2 size={14} className={styles.spinnerIcon} />
          <span className={styles.statusRunning}>Running</span>
        </div>
        <div className={styles.cellOutput}>
          {cell.output || <span className={styles.streamingPlaceholder}>...</span>}
        </div>
      </div>
    );
  }

  if (cell.status === 'completed') {
    return (
      <div className={styles.cellContent}>
        <div className={styles.cellHeader}>
          <CheckCircle2 size={14} className={styles.statusCompleted} />
          <span className={styles.statusCompleted}>Completed</span>
          {cell.latencyMs && (
            <span className={styles.latency}>{cell.latencyMs}ms</span>
          )}
        </div>
        <div className={styles.cellOutput}>{cell.output}</div>
      </div>
    );
  }

  if (cell.status === 'failed') {
    return (
      <div className={styles.cellContent}>
        <div className={styles.cellHeader}>
          <XCircle size={14} className={styles.statusFailed} />
          <span className={styles.statusFailed}>Failed</span>
        </div>
        <div className={styles.cellError}>{cell.error}</div>
      </div>
    );
  }

  return (
    <div className={styles.cellPending}>
      <Clock size={14} />
      <span>Pending</span>
    </div>
  );
}

export function ResultsGrid({
  columns,
  executionState,
}: ResultsGridProps) {
  const { cells, isRunning, totalCells, completedCells, failedCells } = executionState;

  // Group cells by record
  const cellsByRecord = new Map<string | null, Map<string, CellState>>();
  cells.forEach((cell) => {
    const recordId = cell.recordId;
    if (!cellsByRecord.has(recordId)) {
      cellsByRecord.set(recordId, new Map());
    }
    cellsByRecord.get(recordId)?.set(cell.columnId, cell);
  });

  // Get unique records (sorted by appearance order)
  const recordIds = Array.from(cellsByRecord.keys());

  return (
    <div className={styles.gridContainer}>
      <div className={styles.gridHeader}>
        <h3 className={styles.gridTitle}>Results</h3>
        <div className={styles.progressInfo}>
          {isRunning ? (
            <>
              <Loader2 size={14} className={styles.spinnerIcon} />
              <span>
                {completedCells + failedCells} / {totalCells}
              </span>
            </>
          ) : (
            <span>
              {completedCells} completed, {failedCells} failed
            </span>
          )}
        </div>
      </div>

      <div className={styles.gridWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.headerCell}>Input</th>
              {columns.map((col) => (
                <th key={col.id} className={styles.headerCell}>
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recordIds.map((recordId, rowIndex) => {
              const rowCells = cellsByRecord.get(recordId);
              // Get input variables from the first cell in this row (if available)
              const firstCell = rowCells?.values().next().value as CellState | undefined;
              const inputVariables = firstCell?.inputVariables as Record<string, unknown> | undefined;

              return (
                <tr key={recordId ?? `row-${rowIndex}`}>
                  <td className={styles.inputCell}>
                    {inputVariables ? (
                      <pre className={styles.inputPreview}>
                        {JSON.stringify(inputVariables, null, 2)}
                      </pre>
                    ) : (
                      <span className={styles.manualInput}>Manual input</span>
                    )}
                  </td>
                  {columns.map((col) => {
                    const cell = rowCells?.get(col.id);
                    return (
                      <td key={col.id} className={styles.outputCell}>
                        <OutputCell cell={cell} isRunning={isRunning} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResultsGrid;
