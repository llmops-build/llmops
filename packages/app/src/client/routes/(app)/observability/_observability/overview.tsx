import { Icon } from '@client/components/icons';
import { createFileRoute } from '@tanstack/react-router';
import { BarChart3, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import {
  useTotalCost,
  useRequestStats,
  useDailyCosts,
} from '@client/hooks/queries/useAnalytics';
import {
  overviewGrid,
  statsCard,
  statsCardLabel,
  statsCardValue,
  statsCardSubvalue,
  sectionTitle,
  chartContainer,
  chartPlaceholder,
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
  // Default to last 30 days
  const dateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }, []);

  const { data: totalCost, isLoading: isLoadingCost } = useTotalCost(dateRange);
  const { data: stats, isLoading: isLoadingStats } = useRequestStats(dateRange);
  const { data: dailyCosts, isLoading: isLoadingDaily } =
    useDailyCosts(dateRange);

  const isLoading = isLoadingCost || isLoadingStats || isLoadingDaily;

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

      <h3 className={sectionTitle}>Daily Costs</h3>
      <div className={chartContainer}>
        {dailyCosts && dailyCosts.length > 0 ? (
          <DailyCostsChart data={dailyCosts} />
        ) : (
          <div className={chartPlaceholder}>No daily cost data available</div>
        )}
      </div>
    </div>
  );
}

interface DailyCostData {
  date: string;
  totalCost: number | string;
  totalInputCost: number | string;
  totalOutputCost: number | string;
  totalTokens: number | string;
  requestCount: number | string;
}

function DailyCostsChart({ data }: { data: DailyCostData[] }) {
  // Simple bar chart implementation using CSS
  // Convert string values to numbers for comparison
  const maxCost = Math.max(...data.map((d) => Number(d.totalCost)), 1);

  // Convert micro-dollars to dollars
  const formatCost = (microDollars: number | string) => {
    const dollars = Number(microDollars) / 1_000_000;
    if (dollars < 0.01) {
      return `$${dollars.toFixed(4)}`;
    }
    return `$${dollars.toFixed(2)}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.slice(-14).map((day) => {
        const cost = Number(day.totalCost);
        const reqCount = Number(day.requestCount);
        return (
          <div
            key={day.date}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
          >
            <span style={{ width: '80px', color: 'var(--gray9)' }}>
              {new Date(day.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <div
              style={{
                flex: 1,
                height: '20px',
                backgroundColor: 'var(--gray3)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(cost / maxCost) * 100}%`,
                  backgroundColor: 'var(--accent9)',
                  minWidth: cost > 0 ? '2px' : 0,
                }}
              />
            </div>
            <span
              style={{
                width: '70px',
                textAlign: 'right',
                color: 'var(--gray11)',
              }}
            >
              {formatCost(day.totalCost)}
            </span>
            <span
              style={{
                width: '50px',
                textAlign: 'right',
                color: 'var(--gray9)',
              }}
            >
              {reqCount}req
            </span>
          </div>
        );
      })}
    </div>
  );
}
