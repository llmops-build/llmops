import {
  Outlet,
  createRootRouteWithContext,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { Page } from '@llmops/ui';
import { AppSidebar } from '@client/components/app-sidebar';
import { contentLayout } from './-styles/root.css';
import type { QueryClient } from '@tanstack/react-query';
import { useAuthMe } from '@client/hooks/queries/useAuthMe';
import { useEffect } from 'react';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { data: auth, isLoading } = useAuthMe();
  const location = useLocation();
  const navigate = useNavigate();

  const isLoginPage = location.pathname === '/login';
  const isAuthenticated = auth?.user != null;

  useEffect(() => {
    // Redirect to login if not authenticated and not already on login page
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      navigate({ to: '/login' });
    }
    // Redirect to home if authenticated and on login page
    if (!isLoading && isAuthenticated && isLoginPage) {
      navigate({ to: '/' });
    }
  }, [isLoading, isAuthenticated, isLoginPage, navigate]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: 'var(--color-text-secondary)',
        }}
      >
        Loading...
      </div>
    );
  }

  // If on login page or not authenticated, render without sidebar
  if (isLoginPage || !isAuthenticated) {
    return <Outlet />;
  }

  // Render full authenticated layout
  return (
    <div>
      <Page>
        <AppSidebar />
        <div className={contentLayout}>
          <Outlet />
        </div>
      </Page>
    </div>
  );
}
