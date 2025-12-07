import '@llmops/ui/global.css';
import './styles/styles.css';
import { routeTree } from '@client/routeTree.gen';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const router = createRouter({
  basepath: window.bootstrapData?.basePath || '/',
  routeTree,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
  interface StaticDataRouteOption {
    customData?: {
      title?: string;
    };
  }
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}

const App = () => {
  return <RouterProvider router={router} />;
};

const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
