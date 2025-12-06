import { Outlet, createRootRoute } from '@tanstack/react-router';
import { Page, Sidebar, lightTheme } from '@llmops/ui';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className={lightTheme}>
      <Page>
        <Sidebar />
        <Outlet />
      </Page>
    </div>
  );
}
