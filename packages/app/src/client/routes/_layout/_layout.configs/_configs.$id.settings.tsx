import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_layout/_layout/configs/_configs/$id/settings'
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Settings</div>;
}
