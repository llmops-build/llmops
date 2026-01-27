import { style } from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  height: '100%',
  overflow: 'hidden',
});

export const tableSection = style({
  flex: 1,
  overflow: 'hidden',
  minWidth: 0,
});

export const detailSection = style({
  width: '400px',
  flexShrink: 0,
  overflow: 'hidden',
});
