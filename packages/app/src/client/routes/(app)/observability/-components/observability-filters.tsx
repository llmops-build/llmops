import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Filter, ChevronDown } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@ui';
import { useEnvironments } from '@client/hooks/queries/useEnvironments';
import { useConfigList } from '@client/hooks/queries/useConfigList';
import { useConfigVariants } from '@client/hooks/queries/useConfigVariants';
import type { ObservabilitySearchParams } from '../route';
import * as styles from './observability-filters.css';

export function ObservabilityFilters() {
  const search = useSearch({ from: '/(app)/observability' });
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const { data: environments } = useEnvironments();
  const { data: configs } = useConfigList();
  // Only fetch variants when a config is selected
  const { data: configVariants } = useConfigVariants(search.configId || '');

  const activeFilterCount = [
    search.environmentId,
    search.configId,
    search.variantId,
  ].filter(Boolean).length;

  const handleEnvironmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || undefined;
    navigate({
      to: '.',
      search: (prev: ObservabilitySearchParams) => ({
        ...prev,
        environmentId: value,
      }),
      replace: true,
    });
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || undefined;
    navigate({
      to: '.',
      search: (prev: ObservabilitySearchParams) => ({
        ...prev,
        configId: value,
        // Clear variant when config changes
        variantId: undefined,
      }),
      replace: true,
    });
  };

  const handleVariantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || undefined;
    navigate({
      to: '.',
      search: (prev: ObservabilitySearchParams) => ({
        ...prev,
        variantId: value,
      }),
      replace: true,
    });
  };

  const clearFilters = () => {
    navigate({
      to: '.',
      search: (prev: ObservabilitySearchParams) => ({
        ...prev,
        environmentId: undefined,
        configId: undefined,
        variantId: undefined,
        tags: undefined,
      }),
      replace: true,
    });
  };

  const getDisplayText = () => {
    if (activeFilterCount === 0) return 'Filters';

    const labels: string[] = [];
    if (search.environmentId) {
      const env = environments?.find((e) => e.id === search.environmentId);
      if (env) labels.push(env.name);
    }
    if (search.configId) {
      const config = configs?.find((c) => c.id === search.configId);
      if (config) labels.push(config.name);
    }
    if (search.variantId && configVariants) {
      const variant = configVariants.find(
        (v) => v.variantId === search.variantId
      );
      if (variant) labels.push(variant.name);
    }

    if (labels.length === 1) return labels[0];
    if (labels.length > 1) return `${labels.length} filters`;
    return 'Filters';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={styles.filtersTrigger}
          data-state={isOpen ? 'open' : 'closed'}
        >
          <Filter size={14} className={styles.filtersTriggerIcon} />
          <span className={styles.filtersTriggerText}>{getDisplayText()}</span>
          {activeFilterCount > 0 && (
            <span className={styles.filtersBadge}>{activeFilterCount}</span>
          )}
          <ChevronDown size={14} className={styles.filtersTriggerIcon} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={4}
        className={styles.filtersContent}
      >
        <div className={styles.filtersHeader}>
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={clearFilters}
            >
              Clear all
            </button>
          )}
        </div>
        <div className={styles.filtersBody}>
          <div className={styles.filterRow}>
            <label className={styles.filterLabel}>Environment</label>
            <select
              className={styles.filterSelect}
              value={search.environmentId || ''}
              onChange={handleEnvironmentChange}
            >
              <option value="">All environments</option>
              {environments?.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name}
                  {env.isProd ? ' (prod)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterRow}>
            <label className={styles.filterLabel}>Config</label>
            <select
              className={styles.filterSelect}
              value={search.configId || ''}
              onChange={handleConfigChange}
            >
              <option value="">All configs</option>
              {configs?.map((config) => (
                <option key={config.id} value={config.id}>
                  {config.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterRow}>
            <label className={styles.filterLabel}>Variant</label>
            <select
              className={styles.filterSelect}
              value={search.variantId || ''}
              onChange={handleVariantChange}
              disabled={!search.configId}
            >
              <option value="">
                {search.configId ? 'All variants' : 'Select a config first'}
              </option>
              {configVariants?.map((variant) => (
                <option key={variant.variantId} value={variant.variantId}>
                  {variant.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
