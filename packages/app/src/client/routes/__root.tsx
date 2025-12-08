import { Link, Outlet, createRootRoute } from '@tanstack/react-router';
import {
  Button,
  Page,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarItem,
  darkTheme,
  lightTheme,
} from '@llmops/ui';
import { Icon } from '@client/components/icons';
import {
  CircleGauge,
  Columns2,
  SlidersVertical,
  Telescope,
} from 'lucide-react';
import { useSidebarWidth } from '@client/hooks/ui/useSidebarWidth';
import { contentLayout } from './-styles/root.css';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { toggleSidebar, isCollapsed } = useSidebarWidth();

  return (
    <div className={lightTheme}>
      <Page>
        <Sidebar>
          <SidebarHeader>
            {!isCollapsed && (
              <Button
                onClick={() => {
                  toggleSidebar();
                }}
                variant="ghost"
                size="icon"
              >
                <Icon icon={Columns2} />
              </Button>
            )}
          </SidebarHeader>
          <SidebarContent>
            <SidebarItem asChild>
              <Link to="/configs">
                <Icon icon={SlidersVertical} />
                Configs
              </Link>
            </SidebarItem>
            <SidebarItem asChild>
              <Link to="/evaluations">
                <Icon icon={CircleGauge} />
                Evaluations
              </Link>
            </SidebarItem>
            <SidebarItem asChild>
              <Link to="/observability">
                <Icon icon={Telescope} />
                Observability
              </Link>
            </SidebarItem>
          </SidebarContent>
        </Sidebar>
        <div className={contentLayout}>
          <Outlet />
        </div>
      </Page>
    </div>
  );
}
