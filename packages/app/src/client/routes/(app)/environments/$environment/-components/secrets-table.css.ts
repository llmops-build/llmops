import { colors, spacing, sprinkles } from '@ui';
import { style } from '@vanilla-extract/css';

export const secretsContainer = style([
  sprinkles({
    padding: 'lg',
  }),
  {
    maxWidth: '600px',
  },
]);

export const secretsSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
});

export const secretsSectionTitle = style({
  fontSize: '1rem',
  fontWeight: 600,
  color: colors.gray12,
  margin: 0,
});

export const secretsZone = style({
  border: `1px solid ${colors.accent7}`,
  borderRadius: spacing.sm,
  overflow: 'hidden',
});

export const secretItem = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing.lg,
  padding: spacing.md,
  backgroundColor: colors.accent2,
  selectors: {
    '&:not(:last-child)': {
      borderBottom: `1px solid ${colors.accent7}`,
    },
  },
});

export const secretItemInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
  flex: 1,
  minWidth: 0,
});

export const secretItemTitle = style({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: colors.gray12,
});

export const secretItemDescription = style({
  fontSize: '0.75rem',
  color: colors.gray10,
});

export const secretValueContainer = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
  marginTop: spacing.xs,
});

export const secretValue = style({
  fontFamily: 'monospace',
  fontSize: '0.8125rem',
  color: colors.accent11,
  backgroundColor: colors.accent3,
  padding: `${spacing.xs} ${spacing.sm}`,
  borderRadius: spacing.xs,
  border: `1px solid ${colors.accent6}`,
  wordBreak: 'break-all',
  flex: 1,
});

export const secretValueHidden = style({
  fontFamily: 'monospace',
  fontSize: '0.8125rem',
  color: colors.gray9,
  backgroundColor: colors.accent3,
  padding: `${spacing.xs} ${spacing.sm}`,
  borderRadius: spacing.xs,
  border: `1px solid ${colors.accent6}`,
  letterSpacing: '0.2em',
  flex: 1,
});

export const secretActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
});

export const iconButton = style({
  padding: spacing.xs,
  fontSize: '0.875rem',
  fontWeight: 500,
  color: colors.accent11,
  backgroundColor: 'transparent',
  border: `1px solid ${colors.accent7}`,
  borderRadius: spacing.xs,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 150ms',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  ':hover': {
    backgroundColor: colors.accent3,
    borderColor: colors.accent8,
  },
});

export const emptyState = style([
  sprinkles({
    padding: 'lg',
    color: 'gray8',
    fontSize: 'sm',
  }),
  {
    textAlign: 'center',
  },
]);
