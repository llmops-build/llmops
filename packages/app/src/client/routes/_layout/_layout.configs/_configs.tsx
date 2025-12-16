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
} from '../-components/twin-split.css';
import {
  gridElement,
  workingArea,
} from '@client/routes/_layout/-components/area.css';
import { Icon } from '@client/components/icons';
import { ChevronRight, Columns2, Plus, SlidersVertical } from 'lucide-react';
import { ConfigsDataTable } from './-components/configs-data-table';
import { useEffect } from 'react';
import { Breadcrumbs, Button, Header } from '@llmops/ui';
import {
  breadcrumbLink,
  chevronStyle,
  headerGroup,
  headerStyle,
} from '../-components/_layout.css';
import { useSidebarWidth } from '@client/hooks/ui/useSidebarWidth';
import { headerStyles } from './-components/configs.css';

export const Route = createFileRoute('/_layout/_layout/configs/_configs')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Configs',
      icon: <Icon icon={SlidersVertical} />,
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

  const handleNavigateToNew = () => {
    console.log('Navigating to new config');
    navigate({ to: '/configs/$id', params: { id: 'new' } });
  };

  useEffect(() => {
    if (params?.id) {
      setTileWidth('35%');
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
            New Config
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
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}
