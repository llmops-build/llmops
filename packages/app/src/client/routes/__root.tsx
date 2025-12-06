import { Outlet, createRootRoute } from '@tanstack/react-router';
import {
  Page,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  lightTheme,
  // darkTheme,
} from '@llmops/ui';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className={lightTheme}>
      <Page>
        <Sidebar>
          <SidebarHeader></SidebarHeader>
          <SidebarContent>Content</SidebarContent>
        </Sidebar>
        <Outlet />
      </Page>
    </div>
  );
}
