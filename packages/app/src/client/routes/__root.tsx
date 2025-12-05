import * as React from 'react';
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { Page, Sidebar } from '@llmops/ui';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <React.Fragment>
      <Page>
        <Sidebar />
        <Outlet />
      </Page>
    </React.Fragment>
  );
}
