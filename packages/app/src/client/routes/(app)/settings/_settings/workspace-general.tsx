import { Icon } from '@client/components/icons';
import { createFileRoute } from '@tanstack/react-router';
import { Building2 } from 'lucide-react';

export const Route = createFileRoute(
  '/(app)/settings/_settings/workspace-general'
)({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Workspace',
      icon: <Icon icon={Building2} />,
    },
  },
});

function RouteComponent() {
  return <>Workspace</>;
}
