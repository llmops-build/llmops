import { createFileRoute } from '@tanstack/react-router';
import SecretsTable from '../-components/secrets-table';

export const Route = createFileRoute(
  '/(app)/environments/$environment/_tabs/secrets'
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { environment } = Route.useParams();

  return <SecretsTable environmentId={environment} />;
}
