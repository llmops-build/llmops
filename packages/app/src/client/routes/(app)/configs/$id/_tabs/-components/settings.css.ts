import { colors, spacing } from '@ui';
import { style } from '@vanilla-extract/css';

export const settingsContainer = style({
  padding: spacing.lg,
  maxWidth: '600px',
});

export const settingsForm = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xl,
});

export const settingsSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
});

export const settingsSectionTitle = style({
  fontSize: '1rem',
  fontWeight: 600,
  color: colors.gray12,
  margin: 0,
});

export const dangerZone = style({
  border: `1px solid ${colors.error7}`,
  borderRadius: spacing.sm,
  overflow: 'hidden',
});

export const dangerItem = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing.lg,
  padding: spacing.md,
  backgroundColor: colors.error2,
});

export const dangerItemInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
});

export const dangerItemTitle = style({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: colors.gray12,
});

export const dangerItemDescription = style({
  fontSize: '0.75rem',
  color: colors.gray10,
});

export const dangerButton = style({
  padding: `${spacing.sm} ${spacing.md}`,
  fontSize: '0.875rem',
  fontWeight: 500,
  color: colors.error11,
  backgroundColor: 'transparent',
  border: `1px solid ${colors.error7}`,
  borderRadius: spacing.xs,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 150ms',
  ':hover': {
    backgroundColor: colors.error3,
    borderColor: colors.error8,
  },
});

// AlertDialog styles
export const backdrop = style({
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 1000,
  transition: 'opacity 150ms',
  selectors: {
    '&[data-starting-style], &[data-ending-style]': {
      opacity: 0,
    },
  },
});

export const popup = style({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: colors.background,
  borderRadius: spacing.sm,
  padding: spacing.lg,
  boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`,
  zIndex: 1001,
  minWidth: '400px',
  maxWidth: '90vw',
  outline: `1px solid ${colors.gray6}`,
  transition: 'opacity 150ms, transform 150ms',
  selectors: {
    '&[data-starting-style], &[data-ending-style]': {
      opacity: 0,
      transform: 'translate(-50%, -50%) scale(0.95)',
    },
  },
});

export const dialogTitle = style({
  fontSize: '1.125rem',
  fontWeight: 600,
  color: colors.gray12,
  margin: 0,
  marginBottom: spacing.sm,
});

export const dialogDescription = style({
  fontSize: '0.875rem',
  color: colors.gray11,
  margin: 0,
  lineHeight: 1.5,
});

export const dialogActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing.sm,
  marginTop: spacing.lg,
});

export const cancelButton = style({
  padding: `${spacing.sm} ${spacing.md}`,
  fontSize: '0.875rem',
  fontWeight: 500,
  color: colors.gray11,
  backgroundColor: colors.gray3,
  border: 'none',
  borderRadius: spacing.xs,
  cursor: 'pointer',
  transition: 'all 150ms',
  ':hover': {
    backgroundColor: colors.gray4,
  },
});

export const confirmDeleteButton = style({
  padding: `${spacing.sm} ${spacing.md}`,
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'white',
  backgroundColor: colors.error9,
  border: 'none',
  borderRadius: spacing.xs,
  cursor: 'pointer',
  transition: 'all 150ms',
  ':hover': {
    backgroundColor: colors.error10,
  },
  ':disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
});
