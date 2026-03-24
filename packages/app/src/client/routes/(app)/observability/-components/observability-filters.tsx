import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Filter, ChevronDown } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent, ComboboxMultiple } from '@ui';
import { useDistinctTags } from '@client/hooks/queries/useAnalytics';
import type { ObservabilitySearchParams } from '../route';
import * as styles from './observability-filters.css';

export function ObservabilityFilters() {
  const search = useSearch({ from: '/(app)/observability' });
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const { data: distinctTags } = useDistinctTags();

  // Group tags by key
  const tagsByKey = useMemo(() => {
    if (!distinctTags) return {};
    return distinctTags.reduce(
      (acc: Record<string, string[]>, { key, value }: { key: string; value: string }) => {
        if (!acc[key]) acc[key] = [];
        acc[key].push(value);
        return acc;
      },
      {} as Record<string, string[]>
    );
  }, [distinctTags]);

  // Parse selected tags from URL search params
  const selectedTags = useMemo(() => {
    if (!search.tags) return {} as Record<string, string[]>;
    try {
      return JSON.parse(search.tags) as Record<string, string[]>;
    } catch {
      return {} as Record<string, string[]>;
    }
  }, [search.tags]);

  // Count selected tag values
  const selectedTagCount = useMemo(() => {
    return Object.values(selectedTags).reduce(
      (sum, values) => sum + values.length,
      0
    );
  }, [selectedTags]);

  const activeFilterCount = selectedTagCount;

  const handleTagChange = useCallback(
    (key: string, values: string[]) => {
      const newTags = { ...selectedTags };

      if (values.length === 0) {
        delete newTags[key];
      } else {
        newTags[key] = values;
      }

      const tagsJson =
        Object.keys(newTags).length > 0 ? JSON.stringify(newTags) : undefined;

      navigate({
        to: '.',
        search: (prev: ObservabilitySearchParams) => ({
          ...prev,
          tags: tagsJson,
        }),
        replace: true,
      });
    },
    [selectedTags, navigate]
  );

  const clearFilters = () => {
    navigate({
      to: '.',
      search: (prev: ObservabilitySearchParams) => ({
        ...prev,
        tags: undefined,
      }),
      replace: true,
    });
  };

  const getDisplayText = () => {
    if (activeFilterCount === 0) return 'Filters';
    return `${activeFilterCount} filters`;
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
          {/* Tags section - only show if there are tags */}
          {Object.keys(tagsByKey).length > 0 && (
            <div className={styles.tagsSection}>
              <div className={styles.tagsSectionHeader}>Tags</div>
              {Object.entries(tagsByKey).map(([key, values]) => (
                <div key={key} className={styles.tagComboboxWrapper}>
                  <ComboboxMultiple<string>
                    items={values}
                    label={key}
                    placeholder={`Select ${key}...`}
                    value={selectedTags[key] || []}
                    onValueChange={(newValues) =>
                      handleTagChange(key, newValues)
                    }
                    itemToString={(item) => item || ''}
                    multiple
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
