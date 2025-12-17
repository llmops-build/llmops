import { Outlet, createRootRoute } from '@tanstack/react-router';
import { Page } from '@llmops/ui';
import { AppSidebar } from '@client/components/app-sidebar';
import { contentLayout } from './-styles/root.css';

export const Route = createRootRoute({
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
