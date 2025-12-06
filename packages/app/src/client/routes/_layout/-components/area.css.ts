import { sprinkles } from '@llmops/ui';
import { style } from '@vanilla-extract/css';

export const gridElement = style({
  gridColumn: '2 / -1',
  gridRow: '2 / 3',
});

export const workingArea = style([
  sprinkles({
    backgroundColor: 'background',
    borderRadius: 'md',
    height: '100%',
    borderWidth: '1',
    borderStyle: 'solid',
    borderColor: 'gray3',
  }),
]);
