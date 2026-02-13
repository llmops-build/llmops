import {
  createFileRoute,
  Link,
  Outlet,
  useMatches,
  useParams,
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
import {
  leftTile,
  rightTile,
  twinSplitContainer,
} from '../-components/twin-split.css';
import clsx from 'clsx';
import {
  observabilityContent,
  observabilityLayout,
} from './-components/observability-sidebar.css';
import { ObservabilitySidebar } from './-components/observability-sidebar';
import { useSidebarWidth } from '@client/hooks/ui/useSidebarWidth';
import { DateRangePicker } from './-components/date-range-picker';
import { ObservabilityFilters } from './-components/observability-filters';
import { useTileWidth } from '@client/hooks/ui/useTileWidth';
import { useEffect } from 'react';
import { TraceDetail } from './-components/trace-detail';

export const Route = createFileRoute('/(app)/observability/_observability')({
  component: RouteComponent,
});

function RouteComponent() {
  const { toggleSidebar } = useSidebarWidth();
  const matches = useMatches();
  const params = useParams({ strict: false });
  const { containerRef, setTileWidth } = useTileWidth();

  const traceId = (params as { traceId?: string }).traceId;

  useEffect(() => {
    if (traceId) {
      setTileWidth('40%');
    } else {
      setTileWidth('100%');
    }
  }, [traceId, setTileWidth]);

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
        <div className={headerGroup}>
          <ObservabilityFilters />
          <DateRangePicker />
        </div>
      </Header>
      <div className={gridElement}>
        <div ref={containerRef} className={twinSplitContainer}>
          <div className={clsx(workingArea, leftTile)}>
            <div className={observabilityLayout}>
              <ObservabilitySidebar />
              <div className={observabilityContent}>
                <Outlet />
              </div>
            </div>
          </div>
          <div className={clsx(workingArea, rightTile)}>
            {traceId && <TraceDetail traceId={traceId} />}
          </div>
        </div>
      </div>
    </>
  );
}
