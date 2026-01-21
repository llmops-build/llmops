import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Network } from 'lucide-react';
import { Icon } from '@client/components/icons';

export const Route = createFileRoute('/(app)/gateway')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Gateway',
      icon: <Icon icon={Network} />,
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
