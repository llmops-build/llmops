import { colors, spacing } from '@ui';
import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.lg,
  padding: spacing.md,
  minHeight: calc.subtract('100vh', calc.multiply(spacing['2xl'], 2)),
});

export const loading = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing.xl,
  color: colors.gray9,
  fontSize: '14px',
});

export const notFound = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing.xl,
  color: colors.gray9,
  fontSize: '14px',
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
});

export const sectionTitle = style({
  fontSize: '14px',
  fontWeight: 500,
  color: colors.gray11,
  margin: 0,
});

export const codeBlock = style({
  padding: spacing.md,
  backgroundColor: colors.gray2,
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.sm,
  fontSize: '13px',
  fontFamily: 'monospace',
  color: colors.gray12,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  margin: 0,
  overflow: 'auto',
  maxHeight: '300px',
});

export const outputsGrid = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
});

export const outputCard = style({
  display: 'flex',
  flexDirection: 'column',
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.sm,
  overflow: 'hidden',
});

export const outputHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.sm} ${spacing.md}`,
  backgroundColor: colors.gray2,
  borderBottom: `1px solid ${colors.gray4}`,
});

export const outputTitle = style({
  fontSize: '13px',
  fontWeight: 500,
  color: colors.gray11,
});

export const latency = style({
  fontSize: '12px',
  color: colors.gray9,
});

export const outputContent = style({
  padding: spacing.md,
  backgroundColor: colors.background,
});

export const outputText = style({
  fontSize: '13px',
  fontFamily: 'monospace',
  color: colors.gray12,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  margin: 0,
  lineHeight: 1.5,
});

export const errorText = style({
  fontSize: '13px',
  color: colors.error9,
});

export const runningText = style({
  fontSize: '13px',
  color: colors.accent9,
  fontStyle: 'italic',
});

export const pendingText = style({
  fontSize: '13px',
  color: colors.gray9,
  fontStyle: 'italic',
});

export const noResult = style({
  fontSize: '13px',
  color: colors.gray8,
  fontStyle: 'italic',
});
