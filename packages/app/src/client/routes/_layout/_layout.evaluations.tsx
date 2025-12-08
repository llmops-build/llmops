import { createFileRoute } from '@tanstack/react-router';
import { workingArea } from '@client/routes/_layout/-components/area.css';
import { Icon } from '@client/components/icons';
import { CircleGauge } from 'lucide-react';

export const Route = createFileRoute('/_layout/_layout/evaluations')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Evaluations',
      icon: <Icon icon={CircleGauge} />,
    },
  },
});

function RouteComponent() {
  return (
    <div className={workingArea}>Hello "/_layout/_layout/evaluations"!</div>
  );
}
