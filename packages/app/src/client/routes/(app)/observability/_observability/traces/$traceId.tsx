import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/(app)/observability/_observability/traces/$traceId'
)({
  component: () => null,
});
