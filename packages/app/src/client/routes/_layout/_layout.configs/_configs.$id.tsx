import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import ConfigsHeader from './-components/configs-header';
import { configTab, configTabsContainer } from './-components/configs.css';

export const Route = createFileRoute('/_layout/_layout/configs/_configs/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return (
    <div>
      <ConfigsHeader id={id} />
      {id === 'new' ? null : (
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
      )}
    </div>
  );
}
