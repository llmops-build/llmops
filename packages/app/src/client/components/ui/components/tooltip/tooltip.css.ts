import { colors, spacing } from '../../tokens';
import { style, keyframes } from '@vanilla-extract/css';

const scaleIn = keyframes({
  from: { transform: 'scale(0.9)', opacity: 0 },
  to: { transform: 'scale(1)', opacity: 1 },
});

const scaleOut = keyframes({
  from: { transform: 'scale(1)', opacity: 1 },
  to: { transform: 'scale(0.9)', opacity: 0 },
});

export const tooltipPositioner = style({
  zIndex: 100,
  outline: 'none',
});

export const tooltipPopup = style({
  backgroundColor: colors.gray12,
  color: colors.gray1,
  borderRadius: spacing.xs,
  padding: `${spacing.xs} ${spacing.sm}`,
  fontSize: '0.75rem',
  lineHeight: '1rem',
  maxWidth: '200px',
  boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15)`,
  transformOrigin: 'var(--transform-origin)',
  selectors: {
    '&[data-starting-style], &[data-ending-style]': {
      animation: `${scaleOut} 100ms ease-out`,
    },
    '&[data-open]': {
      animation: `${scaleIn} 100ms ease-out`,
    },
    '&[data-instant]': {
      transition: 'none',
    },
  },
});

export const tooltipArrow = style({
  display: 'flex',
  selectors: {
    '&[data-side="top"]': {
      bottom: -8,
      transform: 'rotate(180deg)',
    },
    '&[data-side="bottom"]': {
      top: -8,
      transform: 'rotate(0deg)',
    },
    '&[data-side="left"]': {
      right: -13,
      transform: 'rotate(90deg)',
    },
    '&[data-side="right"]': {
      left: -13,
      transform: 'rotate(-90deg)',
    },
  },
});

export const tooltipArrowFill = style({
  fill: colors.gray12,
});
