import { useTileWidth } from '@client/hooks/ui/useTileWidth';
import { createFileRoute, Outlet, useParams } from '@tanstack/react-router';
import clsx from 'clsx';
import {
  leftTile,
  rightTile,
  twinSplitContainer,
} from '../-components/twin-split.css';
import { workingArea } from '@client/routes/_layout/-components/area.css';
import { Icon } from '@client/components/icons';
import { SlidersVertical } from 'lucide-react';
import { ConfigsDataTable } from './-components/configs-data-table';
import { useEffect } from 'react';

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

  useEffect(() => {
    if (params?.id) {
      setTileWidth('40%');
    } else {
      setTileWidth('100%');
    }
  }, [params?.id]);

  return (
    <div ref={containerRef} className={twinSplitContainer}>
      <div className={clsx(workingArea, leftTile)}>
        <ConfigsDataTable />
      </div>
      <div className={clsx(workingArea, rightTile)}>
        <Outlet />
      </div>
    </div>
  );
}
