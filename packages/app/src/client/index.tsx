import '@llmops/ui/global.css';
import './styles/styles.css';
import '@llmops/ui/theme.css';

import { routeTree } from '@client/routeTree.gen';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Providers } from './providers';
import { queryClient } from './lib/queryClient';

const router = createRouter({
  basepath: window.bootstrapData?.basePath || '/',
  routeTree,
  context: {
    queryClient,
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
  interface StaticDataRouteOption {
    customData?: {
      title?: string;
      icon?: React.ReactElement;
    };
  }
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}

const App = () => {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
};

const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
