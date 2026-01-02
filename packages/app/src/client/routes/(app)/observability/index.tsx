import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/(app)/observability/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Navigate to="/observability/overview" />;
}
