import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { formatDistance } from 'date-fns';
import { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Button,
} from '@ui';
import { Icon } from '@client/components/icons';
import { Plus, Database } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import {
  useDatasetRecords,
  type DatasetRecord,
} from '@client/hooks/queries/useDatasetRecords';
import {
  container,
  toolbar,
  toolbarLeft,
  toolbarRight,
  tableContainer,
  rowNumber,
  jsonPreview,
  emptyCell,
  emptyState,
  emptyStateTitle,
  emptyStateDescription,
} from './dataset-records-table.css';

const columnHelper = createColumnHelper<DatasetRecord & { rowIndex: number }>();

type DatasetRecordsTableProps = {
  datasetId: string;
};

function truncateJson(value: unknown, maxLength = 50): string {
  if (value === null || value === undefined) return '';
  try {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
  } catch {
    return String(value);
  }
}

export function DatasetRecordsTable({ datasetId }: DatasetRecordsTableProps) {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const { data: records, isLoading } = useDatasetRecords(datasetId);

  const handleAddRecord = () => {
    navigate({
      to: '/datasets/$id/records/$recordId',
      params: { id: datasetId, recordId: 'new' },
    });
  };

  const handleSelectRecord = (recordId: string) => {
    navigate({
      to: '/datasets/$id/records/$recordId',
      params: { id: datasetId, recordId },
    });
  };

  const dataWithIndex = useMemo(() => {
    return (records || []).map((record, index) => ({
      ...record,
      rowIndex: index + 1,
    }));
  }, [records]);

  const columns = useMemo<ColumnDef<DatasetRecord & { rowIndex: number }, any>[]>(
    () => [
      columnHelper.accessor('rowIndex', {
        header: '#',
        cell: (info) => <span className={rowNumber}>{info.getValue()}</span>,
        size: 50,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: (info) => {
          return formatDistance(new Date(info.getValue()), new Date(), {
            addSuffix: true,
          });
        },
        size: 120,
      }),
      columnHelper.accessor('input', {
        header: 'Input',
        cell: (info) => {
          const value = info.getValue();
          const preview = truncateJson(value, 60);
          return preview ? (
            <span className={jsonPreview}>{preview}</span>
          ) : (
            <span className={emptyCell}>—</span>
          );
        },
      }),
      columnHelper.accessor('expected', {
        header: 'Expected',
        cell: (info) => {
          const value = info.getValue();
          const preview = truncateJson(value, 40);
          return preview ? (
            <span className={jsonPreview}>{preview}</span>
          ) : (
            <span className={emptyCell}>—</span>
          );
        },
      }),
      columnHelper.accessor('metadata', {
        header: 'Metadata',
        cell: (info) => {
          const value = info.getValue();
          const preview = truncateJson(value, 30);
          return preview && preview !== '{}' ? (
            <span className={jsonPreview}>{preview}</span>
          ) : (
            <span className={emptyCell}>—</span>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: dataWithIndex,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 100,
      },
    },
  });

  if (isLoading) {
    return (
      <div className={emptyState}>
        <p>Loading records...</p>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className={container}>
        <div className={toolbar}>
          <div className={toolbarLeft}></div>
          <div className={toolbarRight}>
            <Button variant="outline" scheme="gray" onClick={handleAddRecord}>
              <Icon icon={Plus} />
              Add Row
            </Button>
          </div>
        </div>
        <div className={emptyState}>
          <Database size={48} />
          <h3 className={emptyStateTitle}>No records yet</h3>
          <p className={emptyStateDescription}>
            Add your first record to start building your dataset.
          </p>
          <Button variant="primary" onClick={handleAddRecord}>
            <Icon icon={Plus} />
            Add First Record
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={container}>
      <div className={toolbar}>
        <div className={toolbarLeft}>
          <span className={rowNumber}>{records.length} records</span>
        </div>
        <div className={toolbarRight}>
          <Button variant="outline" scheme="gray" onClick={handleAddRecord}>
            <Icon icon={Plus} />
            Add Row
          </Button>
        </div>
      </div>
      <div className={tableContainer}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHeaderCell
                      key={header.id}
                      sortable={header.column.getCanSort()}
                      onClick={header.column.getToggleSortingHandler()}
                      sortDirection={
                        sorted === 'asc'
                          ? 'asc'
                          : sorted === 'desc'
                            ? 'desc'
                            : null
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHeaderCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                interactive={true}
                key={row.id}
                onClick={() => handleSelectRecord(row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
