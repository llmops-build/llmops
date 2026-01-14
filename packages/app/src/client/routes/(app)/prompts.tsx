import { useTileWidth } from '@client/hooks/ui/useTileWidth';
import {
  createFileRoute,
  Link,
  Outlet,
  useMatches,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import clsx from 'clsx';
import {
  leftTile,
  rightTile,
  twinSplitContainer,
} from './-components/twin-split.css';
import { gridElement, workingArea } from './-components/area.css';
import { Icon } from '@client/components/icons';
import { ChevronRight, Columns2, MessageSquare, Plus } from 'lucide-react';
import { ConfigsDataTable } from './prompts/-components/configs-data-table';
import { useEffect } from 'react';
import { Breadcrumbs, Button, Header } from '@ui';
import {
  breadcrumbLink,
  chevronStyle,
  headerGroup,
  headerStyle,
} from './-components/_layout.css';
import { useSidebarWidth } from '@client/hooks/ui/useSidebarWidth';
import { headerStyles } from './prompts/-components/configs.css';
import ConfigsHeader from './prompts/-components/configs-header';

export const Route = createFileRoute('/(app)/prompts')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Prompts',
      icon: <Icon icon={MessageSquare} />,
    },
  },
});

function RouteComponent() {
  const { containerRef, setTileWidth } = useTileWidth();
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const matches = useMatches();
  const { toggleSidebar } = useSidebarWidth();

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
    navigate({ to: '/prompts/$id', params: { id: 'new' } });
  };

  useEffect(() => {
    if (params?.id) {
      setTileWidth('25%');
    } else {
      setTileWidth('100%');
    }
  }, [params?.id]);

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
            New Prompt
          </Button>
        </div>
      </Header>
      <div className={gridElement}>
        <div ref={containerRef} className={twinSplitContainer}>
          <div className={clsx(workingArea, leftTile)}>
            <div className={headerStyles}></div>
            <ConfigsDataTable />
          </div>
          <div className={clsx(workingArea, rightTile)}>
            <div>
              <ConfigsHeader id={params.id as string} />
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
