import {
  Outlet,
  createRootRouteWithContext,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { Page } from '@ui';
import { AppSidebar } from '@client/components/app-sidebar';
import {
  contentLayout,
  loadingContainer,
  loadingSpinner,
} from './-styles/root.css';
import type { QueryClient } from '@tanstack/react-query';
import { useSession } from '@client/hooks/queries/useSession';
import { useEffect } from 'react';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

// Auth pages that don't need the sidebar layout
const AUTH_PATHS = ['/signin', '/setup'];

function RootComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session, isLoading: isSessionLoading } = useSession();

  // Get setup status from bootstrap data (set by server middleware)
  const setupComplete = window.bootstrapData?.setupComplete ?? false;

  const isAuthPage = AUTH_PATHS.some((path) =>
    location.pathname.startsWith(path)
  );

  useEffect(() => {
    if (isSessionLoading) return;

    // If setup is needed and we're not on the setup page, redirect to setup
    if (!setupComplete && location.pathname !== '/setup') {
      navigate({ to: '/setup' as any });
      return;
    }

    // If setup is complete but not signed in and not on an auth page, redirect to signin
    if (setupComplete && !session && !isAuthPage) {
      navigate({ to: '/signin' as any });
      return;
    }

    // If signed in and on an auth page (except setup), redirect to home
    if (session && isAuthPage && location.pathname !== '/setup') {
      navigate({ to: '/' });
      return;
    }

    // If setup complete and signed in but on setup page, redirect to home
    if (setupComplete && session && location.pathname === '/setup') {
      navigate({ to: '/' });
      return;
    }
  }, [
    isSessionLoading,
    setupComplete,
    session,
    location.pathname,
    isAuthPage,
    navigate,
  ]);

  // Show loading while checking auth state
  if (isSessionLoading) {
    return (
      <div className={loadingContainer}>
        <div className={loadingSpinner} />
      </div>
    );
  }

  // Auth pages render without the sidebar
  if (isAuthPage) {
    return <Outlet />;
  }

  // Regular app layout with sidebar
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
