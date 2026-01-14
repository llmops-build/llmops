import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { tab, tabsContainer } from '@client/styles/tabs.css';

export const Route = createFileRoute('/(app)/prompts/$id/_tabs')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();

  if (!id) {
    return null;
  }

  return (
    <div>
      <div className={tabsContainer}>
        <Link to="/prompts/$id/variants" params={{ id }} className={tab()}>
          <span>Variants</span>
        </Link>
        <Link to="/prompts/$id/targeting" params={{ id }} className={tab()}>
          <span>Targeting</span>
        </Link>
        <Link to="/prompts/$id/settings" params={{ id }} className={tab()}>
          <span>Settings</span>
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
