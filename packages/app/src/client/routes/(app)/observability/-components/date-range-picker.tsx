import { useState } from 'react';
import { Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@ui';
import { useNavigate, useSearch } from '@tanstack/react-router';
import * as styles from './date-range-picker.css';
import type { ObservabilitySearchParams } from '../route';

export const DATE_RANGE_PRESETS = [
  { label: 'Last 15 minutes', value: '15m' },
  { label: 'Last 1 hour', value: '1h' },
  { label: 'Last 3 hours', value: '3h' },
  { label: 'Last 6 hours', value: '6h' },
  { label: 'Last 12 hours', value: '12h' },
  { label: 'Last 24 hours', value: '24h' },
  { label: 'Last 2 days', value: '2d' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
] as const;

// Helper to get date range from preset (returns ISO strings)
const getDateRangeFromPreset = (preset: string) => {
  const endDate = new Date();
  let startDate = new Date();

  switch (preset) {
    case '15m':
      startDate = new Date(endDate.getTime() - 15 * 60 * 1000);
      break;
    case '1h':
      startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
      break;
    case '3h':
      startDate = new Date(endDate.getTime() - 3 * 60 * 60 * 1000);
      break;
    case '6h':
      startDate = new Date(endDate.getTime() - 6 * 60 * 60 * 1000);
      break;
    case '12h':
      startDate = new Date(endDate.getTime() - 12 * 60 * 60 * 1000);
      break;
    case '24h':
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '2d':
      startDate = new Date(endDate.getTime() - 2 * 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return {
    from: startDate.toISOString(),
    to: endDate.toISOString(),
  };
};

// Convert ISO string to local date input value (YYYY-MM-DD)
const isoToDateInputValue = (isoString: string | undefined): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toISOString().split('T')[0];
};

// Convert local date input value to ISO string (start of day in local timezone)
const dateInputToISOStart = (dateValue: string): string => {
  const date = new Date(dateValue + 'T00:00:00');
  return date.toISOString();
};

// Convert local date input value to ISO string (end of day in local timezone)
const dateInputToISOEnd = (dateValue: string): string => {
  const date = new Date(dateValue + 'T23:59:59.999');
  return date.toISOString();
};

export function DateRangePicker() {
  const search = useSearch({ from: '/(app)/observability' });
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(
    isoToDateInputValue(search.from)
  );
  const [customEnd, setCustomEnd] = useState(isoToDateInputValue(search.to));

  const selectedPreset = search.range ?? '7d';
  const selectedPresetLabel =
    DATE_RANGE_PRESETS.find((p) => p.value === selectedPreset)?.label ??
    'Custom';

  const handlePresetClick = (presetValue: string) => {
    const range = getDateRangeFromPreset(presetValue);
    navigate({
      to: '.',
      search: (prev: ObservabilitySearchParams) => ({
        ...prev,
        range: presetValue,
        from: range.from,
        to: range.to,
      }),
      replace: true,
    });
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      navigate({
        to: '.',
        search: (prev: ObservabilitySearchParams) => ({
          ...prev,
          range: 'custom',
          from: dateInputToISOStart(customStart),
          to: dateInputToISOEnd(customEnd),
        }),
        replace: true,
      });
      setIsOpen(false);
    }
  };

  const formatDisplayDate = () => {
    if (selectedPreset !== 'custom') {
      return selectedPresetLabel;
    }
    const from = search.from;
    const to = search.to;
    if (!from || !to) return 'Custom';

    const start = new Date(from);
    const end = new Date(to);
    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };

    if (start.getFullYear() !== end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', { ...formatOptions, year: 'numeric' })} - ${end.toLocaleDateString('en-US', { ...formatOptions, year: 'numeric' })}`;
    }

    return `${start.toLocaleDateString('en-US', formatOptions)} - ${end.toLocaleDateString('en-US', formatOptions)}`;
  };

  return (
    <div className={styles.datePickerWrapper}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={styles.datePickerTrigger}
            data-state={isOpen ? 'open' : 'closed'}
          >
            <Calendar size={14} className={styles.datePickerTriggerIcon} />
            <span className={styles.datePickerTriggerText}>
              {formatDisplayDate()}
            </span>
            <ChevronDown size={14} className={styles.datePickerTriggerIcon} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={4}
          className={styles.datePickerContent}
        >
          <div className={styles.datePickerHeader}>Time range</div>
          <div className={styles.datePickerPresets}>
            {DATE_RANGE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={styles.datePickerPresetItem}
                data-selected={selectedPreset === preset.value}
                onClick={() => handlePresetClick(preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className={styles.datePickerCustomSection}>
            <span className={styles.datePickerCustomLabel}>Custom range</span>
            <div className={styles.datePickerInputRow}>
              <input
                type="date"
                className={styles.datePickerInput}
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <span className={styles.datePickerInputSeparator}>to</span>
              <input
                type="date"
                className={styles.datePickerInput}
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
            <button
              type="button"
              className={styles.datePickerApplyButton}
              onClick={handleApplyCustom}
              disabled={!customStart || !customEnd}
            >
              Apply
            </button>
          </div>
        </PopoverContent>
      </Popover>
      <RefreshButton />
    </div>
  );
}

function RefreshButton() {
  const search = useSearch({ from: '/(app)/observability' });
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    const preset = search.range ?? '7d';

    // For presets, recalculate the dates (to get fresh "now" timestamps)
    if (preset !== 'custom') {
      const range = getDateRangeFromPreset(preset);
      navigate({
        to: '.',
        search: (prev: ObservabilitySearchParams) => ({
          ...prev,
          from: range.from,
          to: range.to,
        }),
        replace: true,
      });
    }

    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <button
      type="button"
      className={styles.refreshButton}
      onClick={handleRefresh}
      title="Refresh data"
    >
      <RefreshCw
        size={14}
        className={isRefreshing ? styles.refreshButtonSpinning : undefined}
      />
    </button>
  );
}
