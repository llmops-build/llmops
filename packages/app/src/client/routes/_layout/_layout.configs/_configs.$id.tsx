import { createFileRoute } from '@tanstack/react-router';
import ConfigsHeader from './-components/configs-header';

export const Route = createFileRoute('/_layout/_layout/configs/_configs/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return (
    <div>
      <ConfigsHeader id={id} />
    </div>
  );
}
