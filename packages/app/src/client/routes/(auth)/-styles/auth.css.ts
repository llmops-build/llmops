import { colors, spacing } from '@ui';
import { style, keyframes } from '@vanilla-extract/css';

export const authContainer = style({
  display: 'flex',
  minHeight: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.gray1,
  padding: spacing.md,
});

export const authCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.lg,
  width: '100%',
  maxWidth: '400px',
  padding: spacing['2xl'],
  backgroundColor: colors.gray2,
  borderRadius: spacing.sm,
  border: `1px solid ${colors.gray4}`,
});

export const authHeader = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing.sm,
  textAlign: 'center',
});

export const authLogo = style({
  width: '48px',
  height: '48px',
  marginBottom: spacing.sm,
});

export const authTitle = style({
  fontSize: '1.5rem',
  fontWeight: 600,
  color: colors.gray12,
  margin: 0,
});

export const authDescription = style({
  fontSize: '0.875rem',
  color: colors.gray9,
  margin: 0,
});

export const authForm = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
});

export const authField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
});

export const authLabel = style({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: colors.gray11,
});

export const authInput = style({
  height: spacing['xl'],
  padding: `0 ${spacing.sm}`,
  fontSize: '0.875rem',
  backgroundColor: colors.gray3,
  color: colors.gray12,
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.xs,
  outline: 'none',
  transition: 'border-color 0.15s ease',
  '::placeholder': {
    color: colors.gray7,
  },
  ':focus': {
    borderColor: colors.accent9,
  },
});

export const authError = style({
  fontSize: '0.75rem',
  color: colors.error9,
  marginTop: spacing.xs,
});

export const authButton = style({
  marginTop: spacing.sm,
});

export const authDivider = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.md,
  color: colors.gray7,
  fontSize: '0.75rem',
  '::before': {
    content: '""',
    flex: 1,
    height: '1px',
    backgroundColor: colors.gray4,
  },
  '::after': {
    content: '""',
    flex: 1,
    height: '1px',
    backgroundColor: colors.gray4,
  },
});

export const authLink = style({
  fontSize: '0.875rem',
  color: colors.accent9,
  textDecoration: 'none',
  textAlign: 'center',
  ':hover': {
    textDecoration: 'underline',
  },
});

export const authFooter = style({
  textAlign: 'center',
  fontSize: '0.875rem',
  color: colors.gray9,
});

// Loading state styles
const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

export const loadingContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: colors.gray1,
});

export const loadingSpinner = style({
  width: '32px',
  height: '32px',
  border: `3px solid ${colors.gray4}`,
  borderTopColor: colors.accent9,
  borderRadius: '50%',
  animation: `${spin} 0.8s linear infinite`,
});
