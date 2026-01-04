import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router';
import { useSession } from '@client/hooks/queries/useSession';
import { loadingContainer, loadingSpinner } from '../-styles/root.css';

export const Route = createFileRoute('/(app)' as any)({
  component: AppLayout,
});

function AppLayout() {
  const { data: session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className={loadingContainer}>
        <div className={loadingSpinner} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/signin" />;
  }

  return <Outlet />;
}
