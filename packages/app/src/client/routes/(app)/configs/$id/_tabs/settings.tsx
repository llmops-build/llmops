import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(app)/configs/$id/_tabs/settings')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Settings',
    },
  },
});

function RouteComponent() {
  return <div>Hello "/(app)/configs/$id/_tabs/settings"!</div>;
}
