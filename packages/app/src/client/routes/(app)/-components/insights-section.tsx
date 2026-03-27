import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { Icon } from '@client/components/icons';
import {
  useRequestStats,
  useTotalCost,
} from '@client/hooks/queries/useAnalytics';
import * as styles from './insights-section.css';

interface Insight {
  id: string;
  type: 'warning' | 'info' | 'success';
  icon: typeof AlertTriangle;
  message: string;
  actionLabel?: string;
  actionTo?: string;
}

function get24hDateRange() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return {
    startDate: yesterday.toISOString(),
    endDate: now.toISOString(),
  };
}

export function InsightsSection() {
  const dateRange = useMemo(() => get24hDateRange(), []);

  const { data: stats } = useRequestStats(dateRange);
  const { data: costs } = useTotalCost(dateRange);

  const insights = useMemo(() => {
    const result: Insight[] = [];

    // Check for high error rate
    if (stats?.totalRequests && stats.totalRequests > 0) {
      const successRate =
        typeof stats.successRate === 'string'
          ? parseFloat(stats.successRate)
          : stats.successRate;

      if (successRate < 95) {
        result.push({
          id: 'high-error-rate',
          type: 'warning',
          icon: AlertTriangle,
          message: `Your success rate is ${successRate.toFixed(1)}% in the last 24 hours. Consider investigating failed requests.`,
          actionLabel: 'View Requests',
          actionTo: '/observability/requests',
        });
      }
    }

    // Positive insight for good performance
    if (
      stats?.totalRequests &&
      stats.totalRequests > 0 &&
      costs?.totalCost !== undefined
    ) {
      const successRate =
        typeof stats.successRate === 'string'
          ? parseFloat(stats.successRate)
          : stats.successRate;

      if (successRate >= 99 && stats.totalRequests >= 100) {
        result.push({
          id: 'great-performance',
          type: 'success',
          icon: TrendingUp,
          message: `Excellent! ${successRate.toFixed(1)}% success rate across ${stats.totalRequests.toLocaleString()} requests.`,
        });
      }
    }

    return result;
  }, [stats, costs]);

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className={styles.insightsContainer}>
      <h2 className={styles.insightsTitle}>Insights</h2>
      <div className={styles.insightsList}>
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={styles.insightItem({ type: insight.type })}
          >
            <Icon
              icon={insight.icon}
              size="sm"
              className={styles.insightIcon({ type: insight.type })}
            />
            <span className={styles.insightMessage}>{insight.message}</span>
            {insight.actionLabel && insight.actionTo && (
              <Link to={insight.actionTo} className={styles.insightAction}>
                {insight.actionLabel}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
