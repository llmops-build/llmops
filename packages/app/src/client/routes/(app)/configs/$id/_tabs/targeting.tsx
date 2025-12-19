import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(app)/configs/$id/_tabs/targeting')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(app)/configs/$id/_tabs/targeting"!</div>;
}
