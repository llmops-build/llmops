import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/(app)/prompts/$id/_variants')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Variants',
    },
  },
});

function RouteComponent() {
  return <Outlet />;
}
