import { Icon } from '@client/components/icons';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import {
  List,
  Loader2,
  Columns3,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useRequestList } from '@client/hooks/queries/useAnalytics';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Popover,
  PopoverTrigger,
  PopoverContent,
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
  columnToggleList,
  columnToggleItem,
  columnToggleCheckbox,
  paginationContainer,
  paginationInfo,
  paginationControls,
  requestsPageWrapper,
} from '../-components/observability.css';
import { format } from 'date-fns';
import clsx from 'clsx';

export const Route = createFileRoute(
  '/(app)/observability/_observability/requests',
)({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Requests',
      icon: <Icon icon={List} />,
    },
  },
});

type RequestRow = {
  id: string;
  createdAt: string;
  configId: string | null;
  provider: string;
  model: string;
  endpoint: string;
  statusCode: number;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  cacheSavings: number;
  cost: number;
  latencyMs: number;
};

const columnHelper = createColumnHelper<RequestRow>();

const PAGE_SIZE = 10;

// Convert micro-dollars to formatted string
const formatCost = (microDollars: number) => {
  const dollars = microDollars / 1_000_000;
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

function RouteComponent() {
  const [offset, setOffset] = useState(0);
  const search = useSearch({ from: '/(app)/observability' });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    provider: false,
    cachedTokens: false,
    cacheSavings: false,
  });

  // Parse tags from URL search params
  const parsedTags = useMemo(() => {
    if (!search.tags) return undefined;
    try {
      return JSON.parse(search.tags) as Record<string, string[]>;
    } catch {
      return undefined;
    }
  }, [search.tags]);

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0);
  }, [
    search.from,
    search.to,
    search.configId,
    search.variantId,
    search.environmentId,
    search.tags,
  ]);

  const { data: requestsResponse, isLoading } = useRequestList({
    limit: PAGE_SIZE,
    offset,
    startDate: search.from,
    endDate: search.to,
    configId: search.configId,
    variantId: search.variantId,
    environmentId: search.environmentId,
    tags: parsedTags,
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor('createdAt', {
        id: 'timestamp',
        header: 'Timestamp',
        cell: (info) => (
          <span className={timestampCell}>
            {format(new Date(info.getValue()), 'yyyy-MM-dd HH:mm:ss')}
          </span>
        ),
      }),
      columnHelper.accessor('provider', {
        header: 'Provider',
        cell: (info) => (
          <span className={timestampCell}>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('model', {
        header: 'Model',
        cell: (info) => (
          <span className={timestampCell}>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('endpoint', {
        header: 'Endpoint',
        cell: (info) => {
          const endpoint = info.getValue().replace(/^\/api\/genai\/v1\//, '');
          return <span className={timestampCell}>{endpoint}</span>;
        },
      }),
      columnHelper.accessor('statusCode', {
        id: 'status',
        header: 'Status',
        cell: (info) => {
          const statusCode = info.getValue();
          return (
            <span
              className={clsx(
                statusBadge,
                statusCode >= 200 && statusCode < 300
                  ? statusSuccess
                  : statusError,
              )}
            >
              {statusCode}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'tokens',
        header: 'Tokens (In → Out)',
        cell: (info) => (
          <span className={timestampCell}>
            {info.row.original.promptTokens.toLocaleString()} →{' '}
            {info.row.original.completionTokens.toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor('cachedTokens', {
        id: 'cachedTokens',
        header: 'Cached Tokens',
        cell: (info) => (
          <span className={timestampCell}>
            {(info.getValue() ?? 0).toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor('cacheSavings', {
        id: 'cacheSavings',
        header: 'Cache Savings',
        cell: (info) => (
          <Tooltip content={formatCostFull(info.getValue() ?? 0)}>
            <span className={timestampCell}>
              {formatCost(info.getValue() ?? 0)}
            </span>
          </Tooltip>
        ),
      }),
      columnHelper.accessor('cost', {
        header: 'Cost',
        cell: (info) => (
          <Tooltip content={formatCostFull(info.getValue())}>
            <span className={timestampCell}>{formatCost(info.getValue())}</span>
          </Tooltip>
        ),
      }),
      columnHelper.accessor('latencyMs', {
        id: 'latency',
        header: 'Latency',
        cell: (info) => (
          <span className={timestampCell}>{info.getValue()}ms</span>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: requestsResponse?.data || [],
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  // Pagination helpers
  const total = requestsResponse?.total ?? 0;
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

  if (isLoading) {
    return (
      <div className={loadingSpinner}>
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  if (!requestsResponse?.data || requestsResponse.data.length === 0) {
    return (
      <div className={emptyState}>
        <p>No requests found in the selected time range.</p>
        <p>Make some API requests through the gateway to see them here.</p>
      </div>
    );
  }

  return (
    <div className={requestsPageWrapper}>
      <div className={requestsHeader}>
        <h3 className={sectionTitle}>Request Logs</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" scheme="gray">
              <Icon icon={Columns3} size="sm" />
              Columns
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={4}>
            <div className={columnToggleList}>
              {table.getAllLeafColumns().map((column) => (
                <label key={column.id} className={columnToggleItem}>
                  <span
                    className={columnToggleCheckbox}
                    data-checked={column.getIsVisible()}
                  >
                    {column.getIsVisible() && <Check size={12} />}
                  </span>
                  {typeof column.columnDef.header === 'string'
                    ? column.columnDef.header
                    : column.id}
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                    style={{ display: 'none' }}
                  />
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
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
                          header.getContext(),
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
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className={paginationContainer}>
        <span className={paginationInfo}>
          Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of{' '}
          {total.toLocaleString()} requests
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
    </div>
  );
}
