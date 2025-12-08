import { createFileRoute } from '@tanstack/react-router';
import { workingArea } from '@client/routes/_layout/-components/area.css';
import { Icon } from '@client/components/icons';
import { Telescope } from 'lucide-react';

export const Route = createFileRoute('/_layout/_layout/observability')({
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
    <div className={workingArea}>Hello "/_layout/_layout/observability"!</div>
  );
}
