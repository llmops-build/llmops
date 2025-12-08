import { createFileRoute } from '@tanstack/react-router';
import { workingArea } from '@client/routes/_layout/-components/area.css';
import { Icon } from '@client/components/icons';
import { SlidersVertical } from 'lucide-react';
import {
  leftTile,
  rightTile,
  twinSplitContainer,
} from './-components/twin-split.css';
import clsx from 'clsx';
import { useTileWidth } from '@client/hooks/ui/useTileWidth';

export const Route = createFileRoute('/_layout/_layout/configs')({
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
        <button onClick={() => setTileWidth('100%')}>100/0</button>
        <button onClick={() => setTileWidth('40%')}>40/60</button>
      </div>
      <div className={clsx(workingArea, rightTile)}></div>
    </div>
  );
}
