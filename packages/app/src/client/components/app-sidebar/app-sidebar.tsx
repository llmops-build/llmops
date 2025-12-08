import { Link } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarItem,
} from '@llmops/ui';
import { Icon } from '@client/components/icons';
import { CircleGauge, SlidersVertical, Telescope } from 'lucide-react';

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        {/*{!isCollapsed && (
          <Button
            onClick={() => {
              toggleSidebar();
            }}
            variant="ghost"
            size="icon"
          >
            <Icon icon={Columns2} />
          </Button>
        )}*/}
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
  );
}