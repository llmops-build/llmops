import { Icon } from '@client/components/icons';
import { createFileRoute, Outlet, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import {
  Route as RouteIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useTraceList } from '@client/hooks/queries/useTraces';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Button,
  Tooltip,
} from '@ui';
import {
  sectionTitle,
  emptyState,
  loadingSpinner,
  tableContainer,
  statusBadge,
  statusSuccess,
  statusError,
  timestampCell,
  requestsHeader,
  paginationContainer,
  paginationInfo,
  paginationControls,
  requestsPageWrapper,
} from '../-components/observability.css';
import { format } from 'date-fns';
import clsx from 'clsx';

export const Route = createFileRoute(
  '/(app)/observability/_observability/traces'
)({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Traces',
      icon: <Icon icon={RouteIcon} />,
    },
  },
});

type TraceRow = {
  id: string;
  traceId: string;
  name: string | null;
  status: string;
  startTime: string;
  endTime: string | null;
  durationMs: number | null;
  spanCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
};

const columnHelper = createColumnHelper<TraceRow>();

const PAGE_SIZE = 20;

const formatCost = (microDollars: number) => {
  const dollars = microDollars / 1_000_000;
  if (dollars === 0) return '$0.00';
  if (dollars < 0.01) {
    return `$${dollars.toFixed(4)}`;
  }
  return `$${dollars.toFixed(2)}`;
};

const formatCostFull = (microDollars: number) => {
  const dollars = microDollars / 1_000_000;
  if (dollars === 0) return '$0.000000';
  return `$${dollars.toFixed(6)}`;
};

const formatDuration = (ms: number | null) => {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const statusUnset = statusBadge;

function RouteComponent() {
  const [offset, setOffset] = useState(0);
  const navigate = useNavigate();
  const search = useSearch({ from: '/(app)/observability' });
  const params = useParams({ strict: false });
  const selectedTraceId = (params as { traceId?: string }).traceId;

  const parsedTags = useMemo(() => {
    if (!search.tags) return undefined;
    try {
      return JSON.parse(search.tags) as Record<string, string[]>;
    } catch {
      return undefined;
    }
  }, [search.tags]);

  useEffect(() => {
    setOffset(0);
  }, [search.from, search.to, search.tags]);

  const { data: tracesResponse, isLoading } = useTraceList({
    limit: PAGE_SIZE,
    offset,
    startDate: search.from,
    endDate: search.to,
    tags: parsedTags,
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor('startTime', {
        id: 'timestamp',
        header: 'Timestamp',
        cell: (info) => (
          <span className={timestampCell}>
            {format(new Date(info.getValue()), 'yyyy-MM-dd HH:mm:ss')}
          </span>
        ),
      }),
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => (
          <span className={timestampCell}>{info.getValue() ?? '—'}</span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          return (
            <span
              className={clsx(
                statusBadge,
                status === 'ok'
                  ? statusSuccess
                  : status === 'error'
                    ? statusError
                    : statusUnset
              )}
            >
              {status}
            </span>
          );
        },
      }),
      columnHelper.accessor('spanCount', {
        header: 'Spans',
        cell: (info) => (
          <span className={timestampCell}>{info.getValue()}</span>
        ),
      }),
      columnHelper.display({
        id: 'tokens',
        header: 'Tokens (In / Out)',
        cell: (info) => (
          <span className={timestampCell}>
            {info.row.original.totalInputTokens.toLocaleString()} /{' '}
            {info.row.original.totalOutputTokens.toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor('totalCost', {
        header: 'Cost',
        cell: (info) => (
          <Tooltip content={formatCostFull(info.getValue())}>
            <span className={timestampCell}>{formatCost(info.getValue())}</span>
          </Tooltip>
        ),
      }),
      columnHelper.accessor('durationMs', {
        header: 'Duration',
        cell: (info) => (
          <span className={timestampCell}>
            {formatDuration(info.getValue())}
          </span>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: tracesResponse?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const total = tracesResponse?.total ?? 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const canGoPrevious = offset > 0;
  const canGoNext = offset + PAGE_SIZE < total;

  const goToPrevious = () => {
    setOffset(Math.max(0, offset - PAGE_SIZE));
  };

  const goToNext = () => {
    setOffset(offset + PAGE_SIZE);
  };

  const handleRowClick = (row: TraceRow) => {
    navigate({
      to: '/observability/traces/$traceId',
      params: { traceId: row.traceId },
      search,
    });
  };

  if (isLoading) {
    return (
      <div className={loadingSpinner}>
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  if (!tracesResponse?.data || tracesResponse.data.length === 0) {
    return (
      <div className={emptyState}>
        <p>No traces found in the selected time range.</p>
        <p>Make some API requests through the gateway to see traces here.</p>
      </div>
    );
  }

  return (
  <>
    <div className={requestsPageWrapper}>
      <div className={requestsHeader}>
        <h3 className={sectionTitle}>Traces</h3>
      </div>
      <div className={tableContainer}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHeaderCell key={header.id}>
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
              <TableRow
                key={row.id}
                interactive
                selected={row.original.traceId === selectedTraceId}
                onClick={() => handleRowClick(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
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
      {total > PAGE_SIZE && (
        <div className={paginationContainer}>
          <span className={paginationInfo}>
            Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of{' '}
            {total.toLocaleString()} traces
          </span>
          <div className={paginationControls}>
            <Button
              variant="outline"
              size="sm"
              scheme="gray"
              onClick={goToPrevious}
              disabled={!canGoPrevious}
            >
              <Icon icon={ChevronLeft} size="sm" />
              Previous
            </Button>
            <span className={paginationInfo}>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              scheme="gray"
              onClick={goToNext}
              disabled={!canGoNext}
            >
              Next
              <Icon icon={ChevronRight} size="sm" />
            </Button>
          </div>
        </div>
      )}
    </div>
    <Outlet />
  </>
  );
}
