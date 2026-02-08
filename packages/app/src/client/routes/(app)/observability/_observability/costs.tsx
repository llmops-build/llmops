import { Icon } from '@client/components/icons';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import { DollarSign, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  useTotalCost,
  useCostSummary,
} from '@client/hooks/queries/useAnalytics';
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
  costBreakdownHeader,
  costBreakdownSelect,
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

type BreakdownBy = 'input-output' | 'model' | 'endpoint' | 'tags';

const SEGMENT_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

function formatCost(microdollars: number): string {
  const dollars = microdollars / 1_000_000;
  return `$${dollars.toFixed(6)}`;
}

function RouteComponent() {
  const search = useSearch({ from: '/(app)/observability' });
  const [breakdownBy, setBreakdownBy] = useState<BreakdownBy>('input-output');
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

  const groupBy =
    breakdownBy !== 'input-output' ? breakdownBy : undefined;
  const { data: summaryData } = useCostSummary(
    { ...analyticsParams, groupBy },
    breakdownBy !== 'input-output'
  );

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

  // Calculate segments for grouped breakdown
  const segments = useMemo(() => {
    if (breakdownBy === 'input-output' || !summaryData?.length) return null;
    const total = summaryData.reduce(
      (sum, item) => sum + Number(item.totalCost),
      0
    );
    if (total === 0) return null;
    return summaryData.map((item, i) => ({
      label: item.groupKey,
      cost: Number(item.totalCost),
      percentage: (Number(item.totalCost) / total) * 100,
      color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    }));
  }, [breakdownBy, summaryData]);

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
        <div className={costBreakdownHeader}>
          <span className={costBreakdownLabel}>Cost Distribution</span>
          <select
            className={costBreakdownSelect}
            value={breakdownBy}
            onChange={(e) => setBreakdownBy(e.target.value as BreakdownBy)}
          >
            <option value="input-output">Input / Output</option>
            <option value="model">Model</option>
            <option value="endpoint">Endpoint</option>
            <option value="tags">Tags</option>
          </select>
        </div>

        {breakdownBy === 'input-output' ? (
          <>
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
                <span
                  className={`${costBreakdownDot} ${costBreakdownDotInput}`}
                />
                <span style={{ color: '#b4b4b4' }}>
                  Input: {totalCost?.totalInputCostFormatted} (
                  {inputPercentage.toFixed(0)}%)
                </span>
              </div>
              <div className={costBreakdownLegendItem}>
                <span
                  className={`${costBreakdownDot} ${costBreakdownDotOutput}`}
                />
                <span style={{ color: '#b4b4b4' }}>
                  Output: {totalCost?.totalOutputCostFormatted} (
                  {outputPercentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          </>
        ) : segments ? (
          <>
            <div className={costBreakdownBarWrapper}>
              <div
                style={{
                  display: 'flex',
                  height: '100%',
                  width: '100%',
                }}
              >
                {segments.map((seg, i) => (
                  <div
                    key={seg.label}
                    title={`${seg.label}: ${formatCost(seg.cost)} (${seg.percentage.toFixed(1)}%)`}
                    style={{
                      width: `${seg.percentage}%`,
                      height: '100%',
                      backgroundColor: seg.color,
                      borderRadius:
                        segments.length === 1
                          ? '4px'
                          : i === 0
                            ? '4px 0 0 4px'
                            : i === segments.length - 1
                              ? '0 4px 4px 0'
                              : '0',
                      transition: 'width 0.3s ease',
                      cursor: 'default',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className={costBreakdownLegend}>
              {segments.map((seg) => (
                <div key={seg.label} className={costBreakdownLegendItem}>
                  <span
                    className={costBreakdownDot}
                    style={{ backgroundColor: seg.color }}
                  />
                  <span style={{ color: '#b4b4b4' }}>
                    {seg.label}: {formatCost(seg.cost)} (
                    {seg.percentage.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
