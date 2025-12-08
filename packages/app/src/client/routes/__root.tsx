import { Outlet, createRootRoute } from '@tanstack/react-router';
import {
  Page,
  darkTheme,
} from '@llmops/ui';
import { AppSidebar } from '@client/components/app-sidebar';
import { contentLayout } from './-styles/root.css';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className={darkTheme}>
      <Page>
        <AppSidebar />
        <div className={contentLayout}>
          <Outlet />
        </div>
      </Page>
    </div>
  );
}
