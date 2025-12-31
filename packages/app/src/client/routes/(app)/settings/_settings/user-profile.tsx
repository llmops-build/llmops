import { Icon } from '@client/components/icons';
import { infoBox } from '@client/styles/info-box.css';
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
  const authType = window.bootstrapData?.authType || 'basic';

  if (authType === 'basic') {
    return (
      <div>
        <div className={infoBox}>
          <Info size={16} />
          <span>
            You are using basic authentication. Profile settings cannot be
            changed in this mode.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Profile</h2>
      {/* Profile settings for non-basic auth will go here */}
    </div>
  );
}
