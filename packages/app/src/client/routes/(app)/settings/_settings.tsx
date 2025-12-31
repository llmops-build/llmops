import {
  createFileRoute,
  Link,
  Outlet,
  useMatches,
} from '@tanstack/react-router';
import {
  breadcrumbLink,
  chevronStyle,
  headerGroup,
  headerStyle,
} from '../-components/_layout.css';
import { Breadcrumbs, Button, Header } from '@client/components/ui';
import { Icon } from '@client/components/icons';
import { ChevronRight, Columns2 } from 'lucide-react';
import { gridElement, workingArea } from '../-components/area.css';
import clsx from 'clsx';
import {
  settingsContent,
  settingsLayout,
} from './-components/settings-sidebar.css';
import { SettingsSidebar } from './-components/settings-sidebar';
import { useSidebarWidth } from '@client/hooks/ui/useSidebarWidth';

export const Route = createFileRoute('/(app)/settings/_settings')({
  component: RouteComponent,
});

function RouteComponent() {
  const { toggleSidebar } = useSidebarWidth();
  const matches = useMatches();

  const breadcrumbItems = matches
    .filter(
      (match) =>
        Boolean(match.staticData.customData?.title) ||
        Boolean((match.loaderData as { title?: string } | undefined)?.title)
    )
    .map((match) => {
      const loaderTitle = (match.loaderData as { title?: string } | undefined)
        ?.title;
      const staticTitle = match.staticData.customData?.title as
        | string
        | undefined;
      const title = loaderTitle ?? staticTitle;

      return {
        key: match.id,
        label: (
          <Link to={match.pathname} className={breadcrumbLink}>
            {title}
          </Link>
        ),
        prefix: match.staticData.customData?.icon,
      };
    });

  return (
    <>
      <Header className={headerStyle}>
        <div className={headerGroup}>
          <Button
            onClick={toggleSidebar}
            size="icon"
            variant="ghost"
            scheme="gray"
          >
            <Icon icon={Columns2} />
          </Button>
          <Icon icon={ChevronRight} className={chevronStyle} />
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </Header>
      <div className={gridElement}>
        <div className={clsx(workingArea, settingsLayout)}>
          <SettingsSidebar />
          <div className={settingsContent}>
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}
