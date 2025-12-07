import { Button, Header } from '@llmops/ui';
import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router';
import { gridElement } from './-components/area.css';
import { Icon } from '@client/components/icons';
import { Columns2 } from 'lucide-react';
import { iconContainer, headerStyle } from './-components/_layout.css';
import {
  SidebarWidthOptions,
  useSidebarWidth,
} from '@client/hooks/ui/useSidebarWidth';

export const Route = createFileRoute('/_layout/_layout')({
  component: RouteComponent,
});

function RouteComponent() {
  const { sidebarWidth, setSidebarWidth } = useSidebarWidth();
  const matches = useMatches();
  return (
    <>
      <Header className={headerStyle}>
        {sidebarWidth === SidebarWidthOptions.COLLAPSED && (
          <div className={iconContainer}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarWidth(SidebarWidthOptions.EXTENDED)}
            >
              <Icon icon={Columns2} />
            </Button>
          </div>
        )}
        {matches.map((match) => {
          if (!match.staticData?.customData?.title) return null;
          return <div>{match.staticData.customData.title}</div>;
        })}
      </Header>
      <div className={gridElement}>
        <Outlet />
      </div>
    </>
  );
}
