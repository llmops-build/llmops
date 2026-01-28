import { colors, spacing } from '@ui';
import { style } from '@vanilla-extract/css';

export const container = style({
  borderTop: `1px solid ${colors.gray4}`,
  marginTop: 'auto',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
});

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.sm} ${spacing.md}`,
  height: spacing['2xl'],
  backgroundColor: colors.background,
  borderBottom: `1px solid ${colors.gray4}`,
});

export const placeholder = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  color: colors.gray9,
  fontSize: '14px',
});

export const tableContainer = style({
  flex: 1,
  overflow: 'auto',
});

export const inputCell = style({
  backgroundColor: colors.gray1,
  borderRight: `1px solid ${colors.gray4}`,
});

export const clampedText = style({
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontSize: '13px',
});

export const outputText = style({
  color: colors.gray9,
  fontStyle: 'italic',
  fontSize: '13px',
});

export const outputCell = style({
  minWidth: '200px',
});

export const runningText = style({
  color: colors.accent9,
  fontStyle: 'italic',
});

export const errorText = style({
  color: colors.error9,
  fontSize: '13px',
});

export const clickableRow = style({
  cursor: 'pointer',
  ':hover': {
    backgroundColor: colors.gray2,
  },
});
