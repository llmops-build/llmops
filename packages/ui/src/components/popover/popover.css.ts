import { colors, spacing } from '../../tokens';
import { style, keyframes } from '@vanilla-extract/css';

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const fadeOut = keyframes({
  from: { opacity: 1 },
  to: { opacity: 0 },
});

const scaleIn = keyframes({
  from: { transform: 'scale(0.95)', opacity: 0 },
  to: { transform: 'scale(1)', opacity: 1 },
});

const scaleOut = keyframes({
  from: { transform: 'scale(1)', opacity: 1 },
  to: { transform: 'scale(0.95)', opacity: 0 },
});

export const popoverPositioner = style({
  zIndex: 100,
  outline: 'none',
});

export const popoverPopup = style({
  backgroundColor: colors.gray1,
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.sm,
  boxShadow: `0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)`,
  outline: 'none',
  minWidth: '280px',
  maxWidth: '400px',
  selectors: {
    '&[data-starting-style], &[data-ending-style]': {
      animation: `${scaleOut} 150ms ease-out`,
    },
    '&[data-open]': {
      animation: `${scaleIn} 150ms ease-out`,
    },
  },
});

export const popoverArrow = style({
  width: 10,
  height: 10,
  fill: colors.gray1,
  stroke: colors.gray4,
  strokeWidth: 1,
  selectors: {
    '&[data-side="top"]': {
      bottom: -10,
    },
    '&[data-side="bottom"]': {
      top: -10,
    },
    '&[data-side="left"]': {
      right: -10,
    },
    '&[data-side="right"]': {
      left: -10,
    },
  },
});

export const popoverTitle = style({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: colors.gray12,
  margin: 0,
  padding: `${spacing.sm} ${spacing.md}`,
  borderBottom: `1px solid ${colors.gray4}`,
});

export const popoverDescription = style({
  fontSize: '0.8125rem',
  color: colors.gray11,
  margin: 0,
  padding: `${spacing.sm} ${spacing.md}`,
});

export const popoverContent = style({
  padding: spacing.md,
});

export const popoverClose = style({
  position: 'absolute',
  top: spacing.sm,
  right: spacing.sm,
  padding: spacing.xs,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: colors.gray9,
  borderRadius: spacing.xs,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  ':hover': {
    backgroundColor: colors.gray3,
    color: colors.gray11,
  },
});

export const popoverBackdrop = style({
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  zIndex: 99,
  selectors: {
    '&[data-starting-style], &[data-ending-style]': {
      animation: `${fadeOut} 150ms ease-out`,
    },
    '&[data-open]': {
      animation: `${fadeIn} 150ms ease-out`,
    },
  },
});
