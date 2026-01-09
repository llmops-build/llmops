import { colors, spacing } from '@ui';
import { style } from '@vanilla-extract/css';

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
  width: '500px',
  maxWidth: '90vw',
  maxHeight: '85vh',
  overflow: 'auto',
  outline: `1px solid ${colors.gray6}`,
  transition: 'opacity 150ms, transform 150ms',
  selectors: {
    '&[data-starting-style], &[data-ending-style]': {
      opacity: 0,
      transform: 'translate(-50%, -50%) scale(0.95)',
    },
  },
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  marginBottom: spacing.md,
});

export const successIconContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2rem',
  height: '2rem',
  borderRadius: '50%',
  backgroundColor: colors.accent3,
  color: colors.accent11,
  flexShrink: 0,
});

export const title = style({
  fontSize: '1.125rem',
  fontWeight: 600,
  color: colors.gray12,
  margin: 0,
  flex: 1,
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

export const description = style({
  fontSize: '0.875rem',
  color: colors.gray11,
  margin: 0,
  marginBottom: spacing.lg,
  lineHeight: 1.5,
});

export const curlSection = style({
  backgroundColor: colors.gray2,
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.sm,
  overflow: 'hidden',
});

export const curlHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.sm} ${spacing.md}`,
  borderBottom: `1px solid ${colors.gray4}`,
  backgroundColor: colors.gray3,
});

export const curlLabel = style({
  fontSize: '0.75rem',
  fontWeight: 500,
  color: colors.gray11,
});

export const copyButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing.xs,
  padding: `${spacing.xs} ${spacing.sm}`,
  fontSize: '0.75rem',
  fontWeight: 500,
  color: colors.gray11,
  backgroundColor: colors.gray1,
  border: `1px solid ${colors.gray6}`,
  borderRadius: spacing.xs,
  cursor: 'pointer',
  transition: 'all 150ms',
  ':hover': {
    backgroundColor: colors.gray4,
    borderColor: colors.gray7,
  },
});

export const curlCode = style({
  margin: 0,
  padding: spacing.md,
  fontSize: '0.75rem',
  fontFamily: 'monospace',
  color: colors.gray12,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  lineHeight: 1.6,
  overflowX: 'auto',
});

export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: spacing.lg,
});
