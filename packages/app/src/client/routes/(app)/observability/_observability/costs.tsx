import { Icon } from '@client/components/icons';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import { DollarSign, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTotalCost } from '@client/hooks/queries/useAnalytics';
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

  return (
    <div>
      <div className={overviewGrid}>
        <div className={statsCard}>
          <span className={statsCardLabel}>Total Cost</span>
          <p className={statsCardValue}>{totalCost?.totalCostFormatted}</p>
        </div>
        <div className={statsCard}>
          <span className={statsCardLabel}>Input Cost</span>
          <p className={statsCardValue}>{totalCost?.totalInputCostFormatted}</p>
          <span className={statsCardSubvalue}>
            {totalCost?.totalPromptTokens.toLocaleString()} tokens
          </span>
        </div>
        <div className={statsCard}>
          <span className={statsCardLabel}>Output Cost</span>
          <p className={statsCardValue}>
            {totalCost?.totalOutputCostFormatted}
          </p>
          <span className={statsCardSubvalue}>
            {totalCost?.totalCompletionTokens.toLocaleString()} tokens
          </span>
        </div>
        <div className={statsCard}>
          <span className={statsCardLabel}>Requests</span>
          <p className={statsCardValue}>
            {totalCost?.requestCount.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
