import {
  Outlet,
  createRootRouteWithContext,
  useLocation,
} from '@tanstack/react-router';
import { Page } from '@ui';
import { AppSidebar } from '@client/components/app-sidebar';
import { contentLayout } from './-styles/root.css';
import type { QueryClient } from '@tanstack/react-query';

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

  const isAuthPage = AUTH_PATHS.some((path) =>
    location.pathname.startsWith(path)
  );

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
