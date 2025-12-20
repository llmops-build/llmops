import { spacing } from '@llmops/ui';
import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

export const newConfigStateContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: calc.subtract('100%', spacing['2xl']),
});

export const newConfigStateContent = style({});
