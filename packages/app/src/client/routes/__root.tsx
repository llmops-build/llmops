import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
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

function RootComponent() {
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
