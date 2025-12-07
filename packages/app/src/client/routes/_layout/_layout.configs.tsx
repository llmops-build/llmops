import { createFileRoute } from '@tanstack/react-router';
import { workingArea } from '@client/routes/_layout/-components/area.css';

export const Route = createFileRoute('/_layout/_layout/configs')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Configs',
    },
  },
});

function RouteComponent() {
  return <div className={workingArea}>Hello "/_layout/_layout/prompts"!</div>;
}
