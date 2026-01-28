import { style, keyframes } from '@vanilla-extract/css';
import { colors } from '@ui/tokens/colors.css';
import { spacing } from '@ui/tokens/spacing.css';

export const toastViewport = style({
  position: 'fixed',
  zIndex: 9999,
  width: '320px',
  margin: '0 auto',
  bottom: '1rem',
  right: '1rem',
  left: 'auto',
  top: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
});

const slideIn = keyframes({
  from: {
    transform: 'translateX(100%)',
    opacity: 0,
  },
  to: {
    transform: 'translateX(0)',
    opacity: 1,
  },
});

const slideOut = keyframes({
  from: {
    transform: 'translateX(0)',
    opacity: 1,
  },
  to: {
    transform: 'translateX(100%)',
    opacity: 0,
  },
});

export const toastRoot = style({
  position: 'relative',
  boxSizing: 'border-box',
  backgroundColor: colors.gray2,
  color: colors.gray12,
  border: `1px solid ${colors.gray4}`,
  padding: spacing.md,
  width: '100%',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.24)',
  borderRadius: spacing.sm,
  userSelect: 'none',
  animation: `${slideIn} 0.3s ease-out`,
  selectors: {
    '&[data-ending-style]': {
      animation: `${slideOut} 0.2s ease-in`,
    },
  },
});

export const toastContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
  paddingRight: spacing.lg,
});

export const toastTitle = style({
  fontWeight: 500,
  fontSize: '0.875rem',
  lineHeight: 1.25,
  margin: 0,
  color: colors.gray12,
});

export const toastDescription = style({
  fontSize: '0.8125rem',
  lineHeight: 1.25,
  margin: 0,
  color: colors.gray11,
});

export const toastClose = style({
  position: 'absolute',
  top: spacing.sm,
  right: spacing.sm,
  padding: 0,
  border: 'none',
  background: 'transparent',
  width: '1.25rem',
  height: '1.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: spacing.xs,
  color: colors.gray11,
  cursor: 'pointer',
  ':hover': {
    backgroundColor: colors.gray4,
    color: colors.gray12,
  },
});

export const toastIcon = style({
  width: '1rem',
  height: '1rem',
});
