import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/(app)/settings/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Navigate to="/settings/user-profile" />;
}
