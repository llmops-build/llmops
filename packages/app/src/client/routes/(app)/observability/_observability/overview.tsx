import { Icon } from '@client/components/icons';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import { BarChart3, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import {
  useTotalCost,
  useRequestStats,
  useCostSummary,
} from '@client/hooks/queries/useAnalytics';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  overviewGrid,
  statsCard,
  statsCardLabel,
  statsCardValue,
  statsCardSubvalue,
  emptyState,
  loadingSpinner,
  chartContainer,
  chartsGrid,
  chartWrapper,
  chartTitle,
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

  // Parse tags from URL search params
  const parsedTags = useMemo(() => {
    if (!search.tags) return undefined;
    try {
      return JSON.parse(search.tags) as Record<string, string[]>;
    } catch {
      return undefined;
    }
  }, [search.tags]);

  // Build params with filters from search
  const analyticsParams = {
    ...dateRange,
    configId: search.configId,
    variantId: search.variantId,
    environmentId: search.environmentId,
    tags: parsedTags,
  };

  // Calculate the time range to determine the appropriate interval
  const groupBy = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) {
      return 'day' as const;
    }
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffDays > 5) {
      return 'day' as const;
    } else {
      return 'hour' as const;
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const { data: totalCost, isLoading: isLoadingCost } =
    useTotalCost(analyticsParams);
  const { data: stats, isLoading: isLoadingStats } =
    useRequestStats(analyticsParams);
  const { data: timeSeriesData, isLoading: isLoadingTimeSeries } =
    useCostSummary({ ...analyticsParams, groupBy });

  const isLoading = isLoadingCost || isLoadingStats || isLoadingTimeSeries;

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

  // Format time series data for charts
  const chartData = useMemo(() => {
    if (!timeSeriesData) return [];

    return timeSeriesData.map((item) => {
      const date = new Date(item.groupKey);
      let label: string;

      if (groupBy === 'day') {
        label = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      } else {
        // Hour interval
        label = date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          hour12: true,
        });
      }

      return {
        date: label,
        cost: Number(item.totalCost) || 0,
        requests: Number(item.requestCount) || 0,
        tokens: Number(item.totalTokens) || 0,
      };
    });
  }, [timeSeriesData, groupBy]);

  // Cost values are in microdollars (1/1,000,000 of a dollar)
  const formatCost = (value: number) => {
    const dollars = value / 1_000_000;
    if (dollars >= 1000) {
      return `$${(dollars / 1000).toFixed(1)}k`;
    }
    if (dollars >= 1) {
      return `$${dollars.toFixed(2)}`;
    }
    if (dollars >= 0.01) {
      return `$${dollars.toFixed(2)}`;
    }
    return `$${dollars.toFixed(4)}`;
  };
  const formatTokens = (value: number) =>
    value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString();

  const chartColors = {
    cost: '#10b981',
    requests: '#6366f1',
    tokens: '#f59e0b',
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

      {chartData.length > 0 && (
        <div className={chartsGrid}>
          <div className={chartWrapper}>
            <span className={chartTitle}>Cost Over Time</span>
            <div className={chartContainer}>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#888' }}
                    axisLine={{ stroke: '#444' }}
                    tickLine={{ stroke: '#444' }}
                  />
                  <YAxis
                    tickFormatter={formatCost}
                    tick={{ fontSize: 11, fill: '#888' }}
                    axisLine={{ stroke: '#444' }}
                    tickLine={{ stroke: '#444' }}
                    width={70}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatCost(Number(value) || 0),
                      'Cost',
                    ]}
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#888' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke={chartColors.cost}
                    fill={chartColors.cost}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={chartWrapper}>
            <span className={chartTitle}>Requests Over Time</span>
            <div className={chartContainer}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#888' }}
                    axisLine={{ stroke: '#444' }}
                    tickLine={{ stroke: '#444' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#888' }}
                    axisLine={{ stroke: '#444' }}
                    tickLine={{ stroke: '#444' }}
                    width={50}
                  />
                  <Tooltip
                    formatter={(value) => [Number(value) || 0, 'Requests']}
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#888' }}
                  />
                  <Bar
                    dataKey="requests"
                    fill={chartColors.requests}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={chartWrapper}>
            <span className={chartTitle}>Tokens Over Time</span>
            <div className={chartContainer}>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#888' }}
                    axisLine={{ stroke: '#444' }}
                    tickLine={{ stroke: '#444' }}
                  />
                  <YAxis
                    tickFormatter={formatTokens}
                    tick={{ fontSize: 11, fill: '#888' }}
                    axisLine={{ stroke: '#444' }}
                    tickLine={{ stroke: '#444' }}
                    width={50}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatTokens(Number(value) || 0),
                      'Tokens',
                    ]}
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#888' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tokens"
                    stroke={chartColors.tokens}
                    fill={chartColors.tokens}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
