import { easings, sprinkles } from '@llmops/ui';
import { style } from '@vanilla-extract/css';

export const gridElement = style({
  width: 'calc(100% - var(--sidebar-width))',
  transitionProperty: 'width',
  transitionTimingFunction: easings.easeInOutCubic,
  transitionDuration: '300ms',
});

export const workingArea = style([
  sprinkles({
    backgroundColor: 'background',
    borderRadius: 'md',
    borderWidth: '1',
    borderStyle: 'solid',
    borderColor: 'gray3',
  }),
]);
