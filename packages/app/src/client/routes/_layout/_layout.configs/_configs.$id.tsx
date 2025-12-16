import { createFileRoute } from '@tanstack/react-router';
import UpdateOrCreateConfigName from './-components/update-or-create-config-name';
import ConfigsHeader from './-components/configs-header';

export const Route = createFileRoute('/_layout/_layout/configs/_configs/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return (
    <div>
      <ConfigsHeader />
      <UpdateOrCreateConfigName id={id} />
    </div>
  );
}
