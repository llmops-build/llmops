import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/(app)' as any)({
  component: AppLayout,
});

function AppLayout() {
  return <Outlet />;
}
