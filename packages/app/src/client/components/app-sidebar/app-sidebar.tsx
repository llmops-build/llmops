import { Link } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
} from '@ui';
import { Icon } from '@client/components/icons';
import {
  Blocks,
  Globe,
  Settings,
  SlidersVertical,
  Telescope,
} from 'lucide-react';
import {
  sidebarSectionTitle,
  sidebarSectionTitleHidden,
} from './app-sidebar.css';
import { useSidebarWidth } from '@client/hooks/ui/useSidebarWidth';

export function AppSidebar() {
  const { isCollapsed } = useSidebarWidth();

  return (
    <Sidebar>
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        <SidebarItem asChild>
          <Link to="/">
            <Icon icon={Blocks} />
            Overview
          </Link>
        </SidebarItem>
        <SidebarItem asChild>
          <Link to="/settings">
            <Icon icon={Settings} />
            Settings
          </Link>
        </SidebarItem>
        <span
          className={`${sidebarSectionTitle} ${isCollapsed ? sidebarSectionTitleHidden : ''}`}
        >
          Workspace
        </span>
        <SidebarItem asChild>
          <Link to="/configs">
            <Icon icon={SlidersVertical} />
            Configs
          </Link>
        </SidebarItem>
        <SidebarItem asChild>
          <Link to="/environments">
            <Icon icon={Globe} />
            Environments
          </Link>
        </SidebarItem>
        <SidebarItem asChild>
          <Link to="/observability">
            <Icon icon={Telescope} />
            Observability
          </Link>
        </SidebarItem>
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
