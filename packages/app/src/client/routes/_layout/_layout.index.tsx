import { createFileRoute } from '@tanstack/react-router';
import { workingArea } from '@client/routes/_layout/-components/area.css';
import { Icon } from '@client/components/icons';
import { Blocks } from 'lucide-react';

export const Route = createFileRoute('/_layout/_layout/')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Overview',
      icon: <Icon icon={Blocks} />,
    },
  },
});

function RouteComponent() {
  return <div className={workingArea}>Hello "/_layout/_layout/"!</div>;
}
