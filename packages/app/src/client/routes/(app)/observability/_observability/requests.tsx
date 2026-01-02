import { Icon } from '@client/components/icons';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import { List, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRequestList } from '@client/hooks/queries/useAnalytics';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
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
} from '../-components/observability.css';
import { format } from 'date-fns';
import clsx from 'clsx';

export const Route = createFileRoute(
  '/(app)/observability/_observability/requests'
)({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Requests',
      icon: <Icon icon={List} />,
    },
  },
});

function RouteComponent() {
  const [limit] = useState(50);
  const [offset] = useState(0);
  const search = useSearch({ from: '/(app)/observability' });

  const { data: requests, isLoading } = useRequestList({
    limit,
    offset,
    startDate: search.from,
    endDate: search.to,
  });

  // Convert micro-dollars to formatted string
  const formatCost = (microDollars: number) => {
    const dollars = microDollars / 1_000_000;
    if (dollars < 0.01) {
      return `$${dollars.toFixed(4)}`;
    }
    return `$${dollars.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className={loadingSpinner}>
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className={emptyState}>
        <p>No requests found in the selected time range.</p>
        <p>Make some API requests through the gateway to see them here.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className={sectionTitle}>Request Logs</h3>
      <div className={tableContainer}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Timestamp</TableHeaderCell>
              <TableHeaderCell>Provider</TableHeaderCell>
              <TableHeaderCell>Model</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Tokens (In → Out)</TableHeaderCell>
              <TableHeaderCell>Cost</TableHeaderCell>
              <TableHeaderCell>Latency</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <span className={timestampCell}>
                    {format(new Date(request.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={timestampCell}>{request.provider}</span>
                </TableCell>
                <TableCell>
                  <span className={timestampCell}>{request.model}</span>
                </TableCell>
                <TableCell>
                  <span
                    className={clsx(
                      statusBadge,
                      request.statusCode >= 200 && request.statusCode < 300
                        ? statusSuccess
                        : statusError
                    )}
                  >
                    {request.statusCode}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={timestampCell}>
                    {request.promptTokens.toLocaleString()} →{' '}
                    {request.completionTokens.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>{formatCost(request.cost)}</TableCell>
                <TableCell>{request.latencyMs}ms</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
