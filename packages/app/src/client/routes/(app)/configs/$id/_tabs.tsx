import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { configTab, configTabsContainer } from '../-components/configs.css';

export const Route = createFileRoute('/(app)/configs/$id/_tabs')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return (
    <div>
      <div className={configTabsContainer}>
        <Link
          to="/configs/$id/variants"
          params={{ id }}
          className={configTab()}
        >
          <span>Variants</span>
        </Link>
        <Link
          to="/configs/$id/settings"
          params={{ id }}
          className={configTab()}
        >
          <span>Settings</span>
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
