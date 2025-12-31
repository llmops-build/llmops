import { Icon } from '@client/components/icons';
import { createFileRoute } from '@tanstack/react-router';
import { Info, User } from 'lucide-react';

export const Route = createFileRoute('/(app)/settings/_settings/user-profile')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Profile',
      icon: <Icon icon={User} />,
    },
  },
});

function RouteComponent() {
  return (
    <div>
      <h1>Profile</h1>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: 'var(--color-blue3)',
          border: '1px solid var(--color-blue6)',
          borderRadius: '6px',
          color: 'var(--color-blue11)',
          marginTop: '16px',
        }}
      >
        <Info size={16} />
        <span>
          You are using basic authentication. Profile settings cannot be changed
          in this mode.
        </span>
      </div>
    </div>
  );
}
