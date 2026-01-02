import { Icon } from '@client/components/icons';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import { BarChart3, Loader2 } from 'lucide-react';
import {
  useTotalCost,
  useRequestStats,
} from '@client/hooks/queries/useAnalytics';
import {
  overviewGrid,
  statsCard,
  statsCardLabel,
  statsCardValue,
  statsCardSubvalue,
  emptyState,
  loadingSpinner,
} from '../-components/observability.css';

export const Route = createFileRoute(
  '/(app)/observability/_observability/overview'
)({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Overview',
      icon: <Icon icon={BarChart3} />,
    },
  },
});

function RouteComponent() {
  const search = useSearch({ from: '/(app)/observability' });
  const dateRange = {
    startDate: search.from ?? '',
    endDate: search.to ?? '',
  };

  const { data: totalCost, isLoading: isLoadingCost } = useTotalCost(dateRange);
  const { data: stats, isLoading: isLoadingStats } = useRequestStats(dateRange);

  const isLoading = isLoadingCost || isLoadingStats;

  if (isLoading) {
    return (
      <div className={loadingSpinner}>
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  // Convert string values to numbers (PostgreSQL returns aggregates as strings)
  const requestCount = Number(totalCost?.requestCount ?? 0);
  const hasData = totalCost && requestCount > 0;

  if (!hasData) {
    return (
      <div className={emptyState}>
        <p>No request data available yet.</p>
        <p>Make some API requests through the gateway to see analytics here.</p>
      </div>
    );
  }

  // Helper to safely format numbers that might be strings
  const formatNumber = (value: string | number | null | undefined): string => {
    if (value == null) return '0';
    const num = Number(value);
    return isNaN(num) ? '0' : num.toLocaleString();
  };

  const formatLatency = (value: string | number | null | undefined): string => {
    if (value == null) return '0';
    const num = Number(value);
    return isNaN(num) ? '0' : Math.round(num).toString();
  };

  return (
    <div>
      <div className={overviewGrid}>
        <div className={statsCard}>
          <span className={statsCardLabel}>Total Cost</span>
          <p className={statsCardValue}>{totalCost?.totalCostFormatted}</p>
          <div>
            <span className={statsCardSubvalue}>
              Input: {totalCost?.totalInputCostFormatted}
            </span>
            <span className={statsCardSubvalue}>
              Output: {totalCost?.totalOutputCostFormatted}
            </span>
          </div>
        </div>
        <div className={statsCard}>
          <span className={statsCardLabel}>Total Requests</span>
          <p className={statsCardValue}>{formatNumber(stats?.totalRequests)}</p>
          <span className={statsCardSubvalue}>
            {stats?.successRate}% success rate
          </span>
        </div>
        <div className={statsCard}>
          <span className={statsCardLabel}>Total Tokens</span>
          <p className={statsCardValue}>
            {formatNumber(totalCost?.totalTokens)}
          </p>
          <div>
            <span className={statsCardSubvalue}>
              Prompt: {formatNumber(totalCost?.totalPromptTokens)}
            </span>
            <span className={statsCardSubvalue}>
              Completion: {formatNumber(totalCost?.totalCompletionTokens)}
            </span>
          </div>
        </div>
        <div className={statsCard}>
          <span className={statsCardLabel}>Avg Latency</span>
          <p className={statsCardValue}>
            {formatLatency(stats?.avgLatencyMs)}ms
          </p>
          <div>
            <span className={statsCardSubvalue}>
              Min: {formatLatency(stats?.minLatencyMs)}ms
            </span>
            <span className={statsCardSubvalue}>
              Max: {formatLatency(stats?.maxLatencyMs)}ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
