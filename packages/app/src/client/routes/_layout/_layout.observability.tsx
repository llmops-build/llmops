import { createFileRoute } from '@tanstack/react-router';
import { workingArea } from '@client/routes/_layout/-components/area.css';

export const Route = createFileRoute('/_layout/_layout/observability')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className={workingArea}>Hello "/_layout/_layout/observability"!</div>
  );
}
