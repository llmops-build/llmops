import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { tab, tabsContainer } from '@client/styles/tabs.css';

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
      <div className={tabsContainer}>
        <Link
          to="/environments/$environment/secrets"
          params={{ environment }}
          className={tab()}
        >
          <span>Secrets</span>
        </Link>
        <Link
          to="/environments/$environment/settings"
          params={{ environment }}
          className={tab()}
        >
          <span>Settings</span>
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
