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
import { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '@llmops/ui';
import { useEnvironments } from '@client/hooks/queries/useEnvironments';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { environmentByIdQueryOptions } from '@client/hooks/queries/useEnvironmentById';

type Environment = {
  id: string;
  name: string;
  slug: string;
  isProd: boolean;
  createdAt: string;
  updatedAt: string;
};

const columnHelper = createColumnHelper<Environment>();

export function EnvironmentsDataTable() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const { data } = useEnvironments();
  const navigate = useNavigate();
  const { environment: selectedId } = useParams({ strict: false });
  const queryClient = useQueryClient();

  const handleRowHover = useCallback(
    (environmentId: string) => {
      queryClient.prefetchQuery(environmentByIdQueryOptions(environmentId));
    },
    [queryClient]
  );

  const columns = useMemo<ColumnDef<Environment, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => {
          const isProd = info.row.original.isProd;
          return isProd
            ? `${info.getValue()} (this environment)`
            : info.getValue();
        },
      }),
      columnHelper.accessor('isProd', {
        header: 'Production',
        cell: (info) => (info.getValue() ? 'Yes' : 'No'),
      }),
      columnHelper.accessor('createdAt', {
        header: 'Creation Date',
        cell: (info) => {
          return formatDistance(new Date(info.getValue()), new Date(), {
            addSuffix: true,
          });
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: data || [],
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

  return (
    <div>
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
              selected={row.original.id === selectedId}
              key={row.id}
              onMouseEnter={() => handleRowHover(row.original.id)}
              onClick={() =>
                navigate({
                  to: '/environments/$environment',
                  params: { environment: row.original.id },
                })
              }
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
  );
}
