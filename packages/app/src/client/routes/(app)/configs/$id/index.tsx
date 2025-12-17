import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/(app)/configs/$id/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  if (id === 'new') return null;

  return (
    <Navigate
      to="/configs/$id/variants"
      params={{
        id,
      }}
      replace
    />
  );
}
