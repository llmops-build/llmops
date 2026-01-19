import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/(app)/gateway/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Navigate to="/gateway/providers" />;
}
