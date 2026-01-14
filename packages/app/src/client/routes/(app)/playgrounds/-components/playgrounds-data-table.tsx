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
} from '@ui';
import { useNavigate, useParams } from '@tanstack/react-router';
import { usePlaygrounds } from '@client/hooks/queries/usePlaygrounds';
import { useQueryClient } from '@tanstack/react-query';
import { playgroundByIdQueryOptions } from '@client/hooks/queries/usePlaygroundById';
import EmptyPlaygroundsState from './empty-playgrounds-state';

type Playground = {
  id: string;
  name: string;
  description: string | null;
  state: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

const columnHelper = createColumnHelper<Playground>();

export function PlaygroundsDataTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const navigate = useNavigate();
  const { id: selectedId } = useParams({ strict: false });
  const { data } = usePlaygrounds();
  const queryClient = useQueryClient();

  const handleRowHover = useCallback(
    (playgroundId: string) => {
      queryClient.prefetchQuery(playgroundByIdQueryOptions(playgroundId));
    },
    [queryClient]
  );

  const columns = useMemo<ColumnDef<Playground, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => info.getValue(),
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
    data: (data as unknown as Playground[]) || [],
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

  if (!data || (data as unknown as any[]).length === 0) {
    return <EmptyPlaygroundsState />;
  }

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
                  to: '/playgrounds/$id',
                  params: { id: row.original.id },
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
