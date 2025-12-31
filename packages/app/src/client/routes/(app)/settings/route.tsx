import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Settings } from 'lucide-react';
import { Icon } from '@client/components/icons';

export const Route = createFileRoute('/(app)/settings')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Settings',
      icon: <Icon icon={Settings} />,
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
