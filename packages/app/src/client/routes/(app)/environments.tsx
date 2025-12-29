import {
  createFileRoute,
  Link,
  Outlet,
  useMatches,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import {
  breadcrumbLink,
  chevronStyle,
  headerGroup,
  headerStyle,
} from './-components/_layout.css';
import { Breadcrumbs, Button, Header } from '@ui';
import { useSidebarWidth } from '@client/hooks/ui/useSidebarWidth';
import { ChevronRight, Columns2, Globe, Plus } from 'lucide-react';
import { Icon } from '@client/components/icons';
import { gridElement, workingArea } from './-components/area.css';
import clsx from 'clsx';
import {
  leftTile,
  rightTile,
  twinSplitContainer,
} from './-components/twin-split.css';
import { EnvironmentsDataTable } from './environments/-components/environments-data-table';
import { useTileWidth } from '@client/hooks/ui/useTileWidth';
import { useEffect } from 'react';
import { headerStyles } from './configs/-components/configs.css';
import EnvironmentsHeader from './environments/$environment/-components/environments-header';

export const Route = createFileRoute('/(app)/environments')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Environments',
      icon: <Icon icon={Globe} />,
    },
  },
});

function RouteComponent() {
  const { toggleSidebar } = useSidebarWidth();
  const { containerRef, setTileWidth } = useTileWidth();
  const params = useParams({ strict: false });
  const matches = useMatches();
  const navigate = useNavigate();

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

  const handleNavigateToNew = () => {
    navigate({ to: '/environments/$environment', params: { environment: 'new' } });
  };

  useEffect(() => {
    if (params?.environment) {
      setTileWidth('25%');
    } else {
      setTileWidth('100%');
    }
  }, [params?.environment]);

  return (
    <>
      <Header className={headerStyle}>
        <div className={headerGroup}>
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
        </div>
        <div className={headerGroup}>
          <Button variant="outline" scheme="gray" onClick={handleNavigateToNew}>
            <Icon icon={Plus} className={chevronStyle} />
            New Environment
          </Button>
        </div>
      </Header>
      <div className={gridElement}>
        <div ref={containerRef} className={twinSplitContainer}>
          <div className={clsx(workingArea, leftTile)}>
            <div className={headerStyles}></div>
            <EnvironmentsDataTable />
          </div>
          <div className={clsx(workingArea, rightTile)}>
            <div>
              <EnvironmentsHeader id={params.environment} />
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
