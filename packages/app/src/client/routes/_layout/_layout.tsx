import { Header } from '@llmops/ui';
import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router';
import { gridElement } from './-components/area.css';
// import { Icon } from '@client/components/icons';
// import { Columns2 } from 'lucide-react';
import { headerStyle } from './-components/_layout.css';
// import {
//   SidebarWidthOptions,
//   useSidebarWidth,
// } from '@client/hooks/ui/useSidebarWidth';

export const Route = createFileRoute('/_layout/_layout')({
  component: RouteComponent,
});

function RouteComponent() {
  const matches = useMatches();
  return (
    <>
      <Header className={headerStyle}>
        {matches.map((match) => {
          if (!match.staticData?.customData?.title) return null;
          return <div key={match.id}>{match.staticData.customData.title}</div>;
        })}
      </Header>
      <div className={gridElement}>
        <Outlet />
      </div>
    </>
  );
}
