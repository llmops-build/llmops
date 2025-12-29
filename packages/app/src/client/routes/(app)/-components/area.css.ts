import { spacing, sprinkles } from '@ui';
import { style } from '@vanilla-extract/css';

export const gridElement = style({
  width: `calc(100vw - var(--sidebar-width) - 2 * ${spacing.sm})`,
  height: `calc(100vh - 2 * ${spacing.sm} - ${spacing['2xl']})`,
});

export const workingArea = style([
  sprinkles({
    backgroundColor: 'background',
    borderRadius: 'sm',
    borderWidth: '1',
    borderStyle: 'solid',
    borderColor: 'gray4',
    height: '100%',
  }),
  {
    position: 'relative',
  },
]);
