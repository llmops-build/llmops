import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_layout/_layout/configs/_configs/$id/_tabs/',
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <Navigate to="/configs/$id/variants" params={{ id }} replace />;
}
