import { createFileRoute } from '@tanstack/react-router';
import { workingArea } from '@client/routes/_layout/-components/area.css';
import { Icon } from '@client/components/icons';
import { SlidersVertical } from 'lucide-react';

export const Route = createFileRoute('/_layout/_layout/configs')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Configs',
      icon: <Icon icon={SlidersVertical} />,
    },
  },
});

function RouteComponent() {
  return <div className={workingArea}></div>;
}
