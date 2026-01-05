import { colors, spacing } from '@ui';
import { style, keyframes } from '@vanilla-extract/css';

// Split layout container
export const authContainer = style({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: colors.gray1,
});

// Left panel - dark with logo and testimonial
export const leftPanel = style({
  display: 'none',
  flex: 1,
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: spacing['2xl'],
  backgroundColor: colors.gray2,
  borderRight: `1px solid ${colors.gray4}`,
  '@media': {
    '(min-width: 768px)': {
      display: 'flex',
    },
  },
});

export const logo = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  fontSize: '1.125rem',
  fontWeight: 600,
  color: colors.gray12,
  lineHeight: 1,
});

export const testimonial = style({
  fontSize: '1rem',
  lineHeight: 1.6,
  color: colors.gray11,
  maxWidth: '400px',
});

// Right panel - form area
export const rightPanel = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing['2xl'],
  position: 'relative',
});

export const topLink = style({
  position: 'absolute',
  top: spacing['2xl'],
  right: spacing['2xl'],
  fontSize: '0.875rem',
  color: colors.gray11,
  textDecoration: 'none',
  ':hover': {
    color: colors.gray12,
  },
});

export const formContainer = style({
  width: '100%',
  maxWidth: '350px',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.lg,
});

export const authHeader = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing.sm,
  textAlign: 'center',
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
  height: '44px',
  padding: `0 ${spacing.md}`,
  fontSize: '0.875rem',
  backgroundColor: colors.gray3,
  color: colors.gray12,
  border: `1px solid ${colors.gray5}`,
  borderRadius: '6px',
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  '::placeholder': {
    color: colors.gray8,
  },
  ':focus': {
    borderColor: colors.gray7,
    boxShadow: `0 0 0 1px ${colors.gray7}`,
  },
});

export const authError = style({
  fontSize: '0.875rem',
  color: colors.error9,
  textAlign: 'center',
  padding: spacing.sm,
  backgroundColor: 'rgba(255, 0, 0, 0.1)',
  borderRadius: '6px',
});

export const authButton = style({
  height: '44px',
  width: '100%',
  fontSize: '0.875rem',
  fontWeight: 500,
});

export const divider = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.md,
  color: colors.gray8,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  '::before': {
    content: '""',
    flex: 1,
    height: '1px',
    backgroundColor: colors.gray5,
  },
  '::after': {
    content: '""',
    flex: 1,
    height: '1px',
    backgroundColor: colors.gray5,
  },
});

export const authFooter = style({
  textAlign: 'center',
  fontSize: '0.875rem',
  color: colors.gray9,
});

export const authLink = style({
  color: colors.gray11,
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  ':hover': {
    color: colors.gray12,
  },
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
