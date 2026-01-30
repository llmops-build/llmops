import { colors, spacing } from '@ui';
import { style } from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  borderLeft: `1px solid ${colors.gray4}`,
  backgroundColor: colors.gray1,
  overflow: 'hidden',
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.md} ${spacing.lg}`,
  borderBottom: `1px solid ${colors.gray4}`,
  backgroundColor: colors.gray2,
});

export const headerTitle = style({
  fontSize: '14px',
  fontWeight: 500,
  color: colors.gray12,
});

export const closeButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing.xs,
  border: 'none',
  backgroundColor: 'transparent',
  color: colors.gray9,
  cursor: 'pointer',
  borderRadius: spacing.xs,
  ':hover': {
    backgroundColor: colors.gray4,
    color: colors.gray12,
  },
});

export const content = style({
  flex: 1,
  overflow: 'auto',
  padding: spacing.lg,
});

export const section = style({
  marginBottom: spacing.lg,
});

export const sectionHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: spacing.sm,
});

export const sectionTitle = style({
  fontSize: '12px',
  fontWeight: 600,
  color: colors.gray11,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

export const codeBlock = style({
  backgroundColor: colors.gray2,
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.sm,
  padding: spacing.md,
  fontFamily: 'monospace',
  fontSize: '12px',
  color: colors.gray12,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  lineHeight: 1.5,
  maxHeight: '300px',
  overflow: 'auto',
});

export const emptyValue = style({
  color: colors.gray9,
  fontStyle: 'italic',
  padding: spacing.md,
  backgroundColor: colors.gray2,
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.sm,
  fontSize: '13px',
});

export const actions = style({
  display: 'flex',
  gap: spacing.sm,
  padding: `${spacing.md} ${spacing.lg}`,
  borderTop: `1px solid ${colors.gray4}`,
  backgroundColor: colors.gray2,
});

export const metadata = style({
  display: 'flex',
  gap: spacing.lg,
  padding: spacing.md,
  borderTop: `1px solid ${colors.gray4}`,
  backgroundColor: colors.gray2,
  fontSize: '12px',
  color: colors.gray11,
});

export const metadataItem = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
});

export const metadataLabel = style({
  fontSize: '11px',
  color: colors.gray9,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

export const metadataValue = style({
  color: colors.gray12,
});
