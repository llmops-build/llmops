import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Telescope } from 'lucide-react';
import { Icon } from '@client/components/icons';

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

export type ObservabilitySearchParams = {
  from?: string;
  to?: string;
  range?: string;
  environmentId?: string;
  configId?: string;
  variantId?: string;
  tags?: string; // JSON string of key-value pairs
};

export const Route = createFileRoute('/(app)/observability')({
  component: RouteComponent,
  validateSearch: (
    search: Record<string, unknown>
  ): ObservabilitySearchParams => {
    const range = (search.range as string) || '7d';
    const defaultRange = getDateRangeFromPreset(range);

    // Validate that from/to are valid ISO strings if provided
    const fromParam = search.from as string | undefined;
    const toParam = search.to as string | undefined;

    // Use provided values or defaults, ensuring they're valid ISO strings
    let from = defaultRange.from;
    let to = defaultRange.to;

    if (fromParam) {
      const parsed = new Date(fromParam);
      if (!isNaN(parsed.getTime())) {
        from = parsed.toISOString();
      }
    }

    if (toParam) {
      const parsed = new Date(toParam);
      if (!isNaN(parsed.getTime())) {
        to = parsed.toISOString();
      }
    }

    // Extract filter params
    const environmentId = search.environmentId as string | undefined;
    const configId = search.configId as string | undefined;
    const variantId = search.variantId as string | undefined;
    const tags = search.tags as string | undefined;

    return {
      range: range,
      from,
      to,
      ...(environmentId && { environmentId }),
      ...(configId && { configId }),
      ...(variantId && { variantId }),
      ...(tags && { tags }),
    };
  },
  staticData: {
    customData: {
      title: 'Observability',
      icon: <Icon icon={Telescope} />,
    },
  },
});

function RouteComponent() {
  return (
    <>
      <Outlet />
    </>
  );
}
