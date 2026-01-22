import { colors, spacing } from '../../tokens';
import { style, keyframes } from '@vanilla-extract/css';

const slideDown = keyframes({
  from: { height: '0' },
  to: { height: 'var(--collapsible-content-height)' },
});

const slideUp = keyframes({
  from: { height: 'var(--collapsible-content-height)' },
  to: { height: '0' },
});

export const collapsibleRoot = style({
  backgroundColor: colors.gray2,
  borderRadius: spacing.sm,
  border: `1px solid ${colors.gray4}`,
  overflow: 'hidden',
});

export const collapsibleTrigger = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: `${spacing.sm} ${spacing.md}`,
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: colors.gray11,
  fontSize: '0.875rem',
  fontWeight: 500,
  textAlign: 'left',
  transition: 'background-color 150ms ease',
  ':hover': {
    backgroundColor: colors.gray3,
  },
  ':focus-visible': {
    outline: `2px solid ${colors.accent9}`,
    outlineOffset: '-2px',
  },
});

export const collapsibleTriggerIcon = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: colors.gray9,
  transition: 'transform 200ms ease',
  selectors: {
    '[data-panel-open] &': {
      transform: 'rotate(180deg)',
    },
  },
});

export const collapsiblePanel = style({
  overflow: 'hidden',
  selectors: {
    '&[data-starting-style]': {
      height: '0',
    },
    '&[data-open]': {
      animation: `${slideDown} 200ms ease-out`,
    },
    '&[data-ending-style]': {
      animation: `${slideUp} 200ms ease-out`,
    },
  },
});

export const collapsibleContent = style({
  padding: spacing.md,
  paddingTop: spacing.none,
});
