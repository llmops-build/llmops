import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Telescope } from 'lucide-react';
import { Icon } from '@client/components/icons';

export const Route = createFileRoute('/(app)/observability')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Observability',
      icon: <Icon icon={Telescope} />,
    },
  },
});

function RouteComponent() {
  return (
    <>
      <Outlet />
    </>
  );
}
