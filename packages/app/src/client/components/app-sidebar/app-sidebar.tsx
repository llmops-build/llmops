import { Link } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  Tooltip,
} from '@ui';
import { Icon } from '@client/components/icons';
import {
  Blocks,
  Globe,
  Settings,
  SlidersVertical,
  Telescope,
} from 'lucide-react';
import Logo from '@client/components/icons/llmops.svg?react';
import type React from 'react';
import { comingSoonTooltip } from './app-sidebar.css';
import { logoWithDarkmode } from '@client/styles/logo.css';

export function AppSidebar() {
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
        <br />
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
        {/*<SidebarItem asChild>
          <Link to="/evaluations">
            <Icon icon={CircleGauge} />
            Evaluations
          </Link>
        </SidebarItem>*/}
        <Tooltip
          content={
            <div className={comingSoonTooltip}>
              <Logo
                className={logoWithDarkmode({ invert: true })}
                style={
                  {
                    height: 14,
                    width: 14,
                  } as React.CSSProperties
                }
              />{' '}
              Coming Soon
            </div>
          }
          side="right"
        >
          <SidebarItem>
            <Icon icon={Telescope} />
            Observability
          </SidebarItem>
        </Tooltip>
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
