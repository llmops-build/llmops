import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_layout/_layout/configs/_configs/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <div>{id}</div>;
}
