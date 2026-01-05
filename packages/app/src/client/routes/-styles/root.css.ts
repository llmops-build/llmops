import { style, keyframes } from '@vanilla-extract/css';
import { colors } from '@ui';

export const contentLayout = style({
  width: 'calc(100% - var(--sidebar-width))',
  // transitionProperty: 'width',
  // transitionTimingFunction: easings.easeInOutCubic,
  // transitionDuration: '300ms',
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
