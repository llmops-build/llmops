import { Breadcrumbs, Button, Header } from '@llmops/ui';
import {
  createFileRoute,
  Link,
  Outlet,
  useMatches,
} from '@tanstack/react-router';
import { gridElement } from './-components/area.css';
import { Icon } from '@client/components/icons';
import { ChevronRight, Columns2 } from 'lucide-react';
import {
  breadcrumbLink,
  chevronStyle,
  headerStyle,
} from './-components/_layout.css';
import { useSidebarWidth } from '@client/hooks/ui/useSidebarWidth';

export const Route = createFileRoute('/_layout/_layout')({
  component: RouteComponent,
});

function RouteComponent() {
  const matches = useMatches();
  const { toggleSidebar } = useSidebarWidth();

  const breadcrumbItems = matches
    .filter((match) => Boolean(match.staticData.customData?.title))
    .map((match) => ({
      key: match.id,
      label: (
        <Link to={match.pathname} className={breadcrumbLink}>
          {match.staticData.customData?.title as string}
        </Link>
      ),
      prefix: match.staticData.customData?.icon,
    }));

  return (
    <>
      <Header className={headerStyle}>
        <Button
          onClick={() => {
            toggleSidebar();
          }}
          size="icon"
          variant="ghost"
          scheme="gray"
        >
          <Icon icon={Columns2} />
        </Button>
        <Icon icon={ChevronRight} className={chevronStyle} />
        <Breadcrumbs items={breadcrumbItems} />
      </Header>
      <div className={gridElement}>
        <Outlet />
      </div>
    </>
  );
}
