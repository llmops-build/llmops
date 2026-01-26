import { Icon } from '@client/components/icons';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import { DollarSign, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTotalCost } from '@client/hooks/queries/useAnalytics';
import {
  emptyState,
  loadingSpinner,
  costMetricsContainer,
  costHero,
  costHeroLabel,
  costHeroValue,
  costMetricsRow,
  costMetricItem,
  costMetricLabel,
  costMetricValue,
  costMetricSubvalue,
  costBreakdownContainer,
  costBreakdownLabel,
  costBreakdownBarWrapper,
  costBreakdownLegend,
  costBreakdownLegendItem,
  costBreakdownDot,
  costBreakdownDotInput,
  costBreakdownDotOutput,
} from '../-components/observability.css';

export const Route = createFileRoute(
  '/(app)/observability/_observability/costs'
)({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Costs',
      icon: <Icon icon={DollarSign} />,
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

  const { data: totalCost, isLoading } = useTotalCost(analyticsParams);

  if (isLoading) {
    return (
      <div className={loadingSpinner}>
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  const hasData = totalCost && totalCost.requestCount > 0;

  if (!hasData) {
    return (
      <div className={emptyState}>
        <p>No cost data available yet.</p>
        <p>
          Make some API requests through the gateway to see cost breakdowns
          here.
        </p>
      </div>
    );
  }

  // Calculate percentages for the breakdown bar
  // Use Number() to coerce values since PostgreSQL may return strings
  const inputCost = Number(totalCost?.totalInputCost) || 0;
  const outputCost = Number(totalCost?.totalOutputCost) || 0;
  const totalCostValue = inputCost + outputCost;
  const inputPercentage =
    totalCostValue > 0 ? (inputCost / totalCostValue) * 100 : 0;
  const outputPercentage =
    totalCostValue > 0 ? (outputCost / totalCostValue) * 100 : 0;

  return (
    <div className={costMetricsContainer}>
      {/* Hero: Total Cost */}
      <div className={costHero}>
        <span className={costHeroLabel}>Total Cost</span>
        <p className={costHeroValue}>{totalCost?.totalCostFormatted}</p>
      </div>

      {/* Secondary metrics row */}
      <div className={costMetricsRow}>
        <div className={costMetricItem}>
          <span className={costMetricLabel}>
            <span
              className={`${costBreakdownDot} ${costBreakdownDotInput}`}
              style={{ width: 6, height: 6 }}
            />
            Input
          </span>
          <p className={costMetricValue}>
            {totalCost?.totalInputCostFormatted}
          </p>
          <span className={costMetricSubvalue}>
            {totalCost?.totalPromptTokens.toLocaleString()} tokens
          </span>
        </div>

        <div className={costMetricItem}>
          <span className={costMetricLabel}>
            <span
              className={`${costBreakdownDot} ${costBreakdownDotOutput}`}
              style={{ width: 6, height: 6 }}
            />
            Output
          </span>
          <p className={costMetricValue}>
            {totalCost?.totalOutputCostFormatted}
          </p>
          <span className={costMetricSubvalue}>
            {totalCost?.totalCompletionTokens.toLocaleString()} tokens
          </span>
        </div>

        <div className={costMetricItem}>
          <span className={costMetricLabel}>Requests</span>
          <p className={costMetricValue}>
            {totalCost?.requestCount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Cost breakdown visualization - CSS-based stacked bar */}
      <div className={costBreakdownContainer}>
        <span className={costBreakdownLabel}>Cost Distribution</span>
        <div
          className={costBreakdownBarWrapper}
          title={`Input: ${totalCost?.totalInputCostFormatted} (${inputPercentage.toFixed(1)}%)\nOutput: ${totalCost?.totalOutputCostFormatted} (${outputPercentage.toFixed(1)}%)`}
        >
          <div
            style={{
              display: 'flex',
              height: '100%',
              width: '100%',
            }}
          >
            <div
              title={`Input: ${totalCost?.totalInputCostFormatted} (${inputPercentage.toFixed(1)}%)`}
              style={{
                width: `${inputPercentage}%`,
                height: '100%',
                backgroundColor: '#10b981',
                borderRadius:
                  outputPercentage === 0 ? '4px' : '4px 0 0 4px',
                transition: 'width 0.3s ease',
                cursor: 'default',
              }}
            />
            <div
              title={`Output: ${totalCost?.totalOutputCostFormatted} (${outputPercentage.toFixed(1)}%)`}
              style={{
                width: `${outputPercentage}%`,
                height: '100%',
                backgroundColor: '#f59e0b',
                borderRadius:
                  inputPercentage === 0 ? '4px' : '0 4px 4px 0',
                transition: 'width 0.3s ease',
                cursor: 'default',
              }}
            />
          </div>
        </div>
        <div className={costBreakdownLegend}>
          <div className={costBreakdownLegendItem}>
            <span className={`${costBreakdownDot} ${costBreakdownDotInput}`} />
            <span style={{ color: '#b4b4b4' }}>
              Input: {totalCost?.totalInputCostFormatted} ({inputPercentage.toFixed(0)}%)
            </span>
          </div>
          <div className={costBreakdownLegendItem}>
            <span className={`${costBreakdownDot} ${costBreakdownDotOutput}`} />
            <span style={{ color: '#b4b4b4' }}>
              Output: {totalCost?.totalOutputCostFormatted} ({outputPercentage.toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
