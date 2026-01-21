import { useMemo } from 'react';
import { useRequestStats, useTotalCost } from '@client/hooks/queries/useAnalytics';
import * as styles from './quick-stats.css';
import clsx from 'clsx';

function get24hDateRange() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return {
    startDate: yesterday.toISOString(),
    endDate: now.toISOString(),
  };
}

export function QuickStats() {
  const dateRange = useMemo(() => get24hDateRange(), []);

  const { data: stats, isLoading: statsLoading } = useRequestStats(dateRange);
  const { data: costs, isLoading: costsLoading } = useTotalCost(dateRange);

  const isLoading = statsLoading || costsLoading;

  const successRate = stats?.successRate
    ? typeof stats.successRate === 'string'
      ? parseFloat(stats.successRate)
      : stats.successRate
    : 0;

  const getSuccessRateStatus = (rate: number): 'good' | 'warning' | 'error' => {
    if (rate >= 95) return 'good';
    if (rate >= 90) return 'warning';
    return 'error';
  };

  if (isLoading) {
    return (
      <div className={styles.quickStatsContainer}>
        <div className={styles.quickStatsSkeleton} />
      </div>
    );
  }

  // Don't show stats if there's no data
  if (!stats?.totalRequests && !costs?.totalCost) {
    return null;
  }

  return (
    <div className={styles.quickStatsContainer}>
      <div className={styles.quickStatsHeader}>
        <h2 className={styles.quickStatsTitle}>Last 24 Hours</h2>
      </div>
      <div className={styles.quickStatsGrid}>
        <div className={styles.quickStatItem}>
          <span className={styles.quickStatValue}>
            {stats?.totalRequests?.toLocaleString() ?? '0'}
          </span>
          <span className={styles.quickStatLabel}>Total Requests</span>
        </div>

        <div className={styles.quickStatItem}>
          <span
            className={clsx(
              styles.quickStatValue,
              styles.quickStatValueStatus({
                status: getSuccessRateStatus(successRate),
              })
            )}
          >
            {successRate.toFixed(1)}%
          </span>
          <span className={styles.quickStatLabel}>Success Rate</span>
        </div>

        <div className={styles.quickStatItem}>
          <span className={styles.quickStatValue}>
            {costs?.totalCostFormatted ?? '$0.00'}
          </span>
          <span className={styles.quickStatLabel}>Total Cost</span>
        </div>

        <div className={styles.quickStatItem}>
          <span className={styles.quickStatValue}>
            {stats?.avgLatencyMs ? `${Math.round(stats.avgLatencyMs)}ms` : '—'}
          </span>
          <span className={styles.quickStatLabel}>Avg Latency</span>
        </div>
      </div>
    </div>
  );
}
