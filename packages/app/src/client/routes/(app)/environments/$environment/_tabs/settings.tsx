import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/(app)/environments/$environment/_tabs/settings'
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Environment Settings</div>;
}
