import { colors, spacing } from '../../tokens';
import { style } from '@vanilla-extract/css';

export const sliderRoot = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
  width: '100%',
});

export const sliderLabel = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.75rem',
  color: colors.gray11,
});

export const sliderValue = style({
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  color: colors.gray12,
  backgroundColor: colors.gray3,
  padding: `2px ${spacing.xs}`,
  borderRadius: spacing.xs,
  minWidth: '3rem',
  textAlign: 'center',
});

export const sliderControl = style({
  display: 'flex',
  alignItems: 'center',
  height: '1.25rem',
  cursor: 'pointer',
  touchAction: 'none',
  selectors: {
    '&[data-disabled]': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  },
});

export const sliderTrack = style({
  position: 'relative',
  height: 4,
  width: '100%',
  backgroundColor: colors.gray4,
  borderRadius: 2,
});

export const sliderIndicator = style({
  position: 'absolute',
  height: '100%',
  backgroundColor: colors.gray9,
  borderRadius: 2,
});

export const sliderThumb = style({
  position: 'absolute',
  width: 14,
  height: 14,
  backgroundColor: colors.background,
  border: `2px solid ${colors.gray9}`,
  borderRadius: '50%',
  transform: 'translateX(-50%)',
  outline: 'none',
  transition: 'border-color 150ms, box-shadow 150ms',
  selectors: {
    '&:hover': {
      borderColor: colors.gray11,
    },
    '&:focus-visible': {
      boxShadow: `0 0 0 2px ${colors.gray4}`,
    },
    '&[data-dragging]': {
      borderColor: colors.gray12,
    },
  },
});
