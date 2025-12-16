import { useTileWidth } from '@client/hooks/ui/useTileWidth';
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import clsx from 'clsx';
import {
  leftTile,
  rightTile,
  twinSplitContainer,
} from '../-components/twin-split.css';
import { workingArea } from '@client/routes/_layout/-components/area.css';
import { Icon } from '@client/components/icons';
import { SlidersVertical } from 'lucide-react';

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
  return (
    <div ref={containerRef} className={twinSplitContainer}>
      <div className={clsx(workingArea, leftTile)}>
        <Link to="/configs" onClick={() => setTileWidth('100%')}>
          100/0
        </Link>
        <Link
          to="/configs/$id"
          params={{
            id: 'a',
          }}
          onClick={() => setTileWidth('40%')}
        >
          40/60
        </Link>
      </div>
      <div className={clsx(workingArea, rightTile)}>
        <Outlet />
      </div>
    </div>
  );
}
