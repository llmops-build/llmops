import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import {
  useDatasetRecords,
  type DatasetRecord,
} from '@client/hooks/queries/useDatasetRecords';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '@ui';
import type { PlaygroundColumn } from '@llmops/core';
import DatasetSelector from './dataset-selector';
import * as styles from './dataset-results-section.css';

type DatasetResultsSectionProps = {
  datasetId: string | null;
  onDatasetChange: (datasetId: string | null) => void;
  columns: PlaygroundColumn[];
};

type RecordRow = DatasetRecord & { rowIndex: number };

const columnHelper = createColumnHelper<RecordRow>();

function formatInputDisplay(input: unknown): string {
  if (input === null || input === undefined) {
    return '';
  }
  if (typeof input === 'string') {
    // Try to parse if it's a JSON string
    try {
      const parsed = JSON.parse(input);
      return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
    } catch {
      return input;
    }
  }
  // If it's already an object, stringify it
  return JSON.stringify(input, null, 2);
}

export function DatasetResultsSection({
  datasetId,
  onDatasetChange,
  columns: playgroundColumns,
}: DatasetResultsSectionProps) {
  const { data: records, isLoading: isLoadingRecords } = useDatasetRecords(
    datasetId ?? '',
    { limit: 100 }
  );

  const dataWithIndex: RecordRow[] = useMemo(
    () =>
      (records ?? []).map((record, index) => ({
        ...record,
        rowIndex: index + 1,
      })),
    [records]
  );

  // Build table columns: Input + one column per playground prompt
  // Memoize based on playground column IDs and names to prevent infinite re-renders
  const columnKey = playgroundColumns.map((c) => `${c.id}:${c.name}`).join(',');
  const tableColumns = useMemo(
    () => [
      columnHelper.accessor('input', {
        header: 'Input',
        cell: (info) => {
          const value = info.getValue();
          const display = formatInputDisplay(value);
          return <div className={styles.clampedText}>{display}</div>;
        },
        size: 300,
      }),
      ...playgroundColumns.map((col) =>
        columnHelper.display({
          id: `output-${col.id}`,
          header: col.name,
          cell: () => <div className={styles.outputText}>—</div>,
        })
      ),
    ],
    [columnKey]
  );

  const table = useReactTable({
    data: dataWithIndex,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const hasRecords = records && records.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div />
        <DatasetSelector value={datasetId} onChange={onDatasetChange} />
      </div>
      {!datasetId ? (
        <div className={styles.placeholder}>
          Select a dataset to run prompts against multiple inputs
        </div>
      ) : isLoadingRecords ? (
        <div className={styles.placeholder}>Loading records...</div>
      ) : !hasRecords ? (
        <div className={styles.placeholder}>
          No records in this dataset. Add records to run prompts.
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHeaderCell
                      key={header.id}
                      style={{
                        width:
                          header.id === 'input'
                            ? `${header.getSize()}px`
                            : undefined,
                        minWidth:
                          header.id === 'input'
                            ? `${header.getSize()}px`
                            : undefined,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHeaderCell>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === 'input'
                          ? styles.inputCell
                          : cell.column.id.startsWith('output-')
                            ? styles.outputCell
                            : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default DatasetResultsSection;
