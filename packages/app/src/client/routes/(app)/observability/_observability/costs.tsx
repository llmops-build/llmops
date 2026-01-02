import { Icon } from '@client/components/icons';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import { DollarSign, Loader2 } from 'lucide-react';
import {
  useTotalCost,
  useCostByModel,
  useCostByProvider,
  useCostByConfig,
} from '@client/hooks/queries/useAnalytics';
import {
  overviewGrid,
  statsCard,
  statsCardLabel,
  statsCardValue,
  statsCardSubvalue,
  emptyState,
  loadingSpinner,
  sectionTitleStandalone,
  costBreakdownGrid,
  breakdownCard,
  breakdownTitle,
  breakdownItem,
  breakdownItemLabel,
  breakdownItemValue,
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

  const { data: totalCost, isLoading: isLoadingCost } = useTotalCost(dateRange);
  const { data: byModel, isLoading: isLoadingModel } =
    useCostByModel(dateRange);
  const { data: byProvider, isLoading: isLoadingProvider } =
    useCostByProvider(dateRange);
  const { data: byConfig, isLoading: isLoadingConfig } =
    useCostByConfig(dateRange);

  const isLoading =
    isLoadingCost || isLoadingModel || isLoadingProvider || isLoadingConfig;

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

      <h3 className={sectionTitleStandalone}>Cost Breakdown</h3>
      <div className={costBreakdownGrid}>
        {byProvider && byProvider.length > 0 && (
          <div className={breakdownCard}>
            <span className={breakdownTitle}>By Provider</span>
            {byProvider.slice(0, 10).map((item) => (
              <div key={item.provider} className={breakdownItem}>
                <span className={breakdownItemLabel}>{item.provider}</span>
                <span className={breakdownItemValue}>
                  {formatCost(item.totalCost)}
                </span>
              </div>
            ))}
          </div>
        )}

        {byModel && byModel.length > 0 && (
          <div className={breakdownCard}>
            <span className={breakdownTitle}>By Model</span>
            {byModel.slice(0, 10).map((item) => (
              <div
                key={`${item.provider}-${item.model}`}
                className={breakdownItem}
              >
                <span className={breakdownItemLabel}>{item.model}</span>
                <span className={breakdownItemValue}>
                  {formatCost(item.totalCost)}
                </span>
              </div>
            ))}
          </div>
        )}

        {byConfig && byConfig.length > 0 && (
          <div className={breakdownCard}>
            <span className={breakdownTitle}>By Config</span>
            {byConfig.slice(0, 10).map((item) => (
              <div key={item.configId || 'no-config'} className={breakdownItem}>
                <span className={breakdownItemLabel}>
                  {item.configName || 'No config'}
                </span>
                <span className={breakdownItemValue}>
                  {formatCost(item.totalCost)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
