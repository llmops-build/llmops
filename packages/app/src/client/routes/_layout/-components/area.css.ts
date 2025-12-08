import { spacing, sprinkles } from '@llmops/ui';
import { style } from '@vanilla-extract/css';

export const gridElement = style({
  width: `calc(100vw - var(--sidebar-width) - 2 * ${spacing.sm})`,
  // transitionProperty: 'width',
  // transitionTimingFunction: easings.easeInOutCubic,
  // transitionDuration: '300ms',
  height: `calc(100vh - 2 * ${spacing.sm} - ${spacing['2xl']})`,
});

export const workingArea = style([
  sprinkles({
    backgroundColor: 'background',
    borderRadius: 'md',
    borderWidth: '1',
    borderStyle: 'solid',
    borderColor: 'gray3',
    height: '100%',
  }),
]);
