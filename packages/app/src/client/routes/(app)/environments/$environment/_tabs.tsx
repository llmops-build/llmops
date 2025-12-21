import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import {
  configTab,
  configTabsContainer,
} from '../../configs/-components/configs.css';

export const Route = createFileRoute('/(app)/environments/$environment/_tabs')({
  component: RouteComponent,
});

function RouteComponent() {
  const { environment } = Route.useParams();

  if (!environment) {
    return null;
  }

  return (
    <div>
      <div className={configTabsContainer}>
        <Link
          to="/environments/$environment/secrets"
          params={{ environment }}
          className={configTab()}
        >
          <span>Secrets</span>
        </Link>
        <Link
          to="/environments/$environment/settings"
          params={{ environment }}
          className={configTab()}
        >
          <span>Settings</span>
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
