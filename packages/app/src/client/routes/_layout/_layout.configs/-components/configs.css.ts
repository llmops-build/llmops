import { colors, spacing, sprinkles } from '@llmops/ui';
import { style } from '@vanilla-extract/css';

export const headerStyles = style({
  padding: `${spacing.sm} ${spacing.xs}`,
  height: spacing['2xl'],
  display: 'flex',
  borderBottom: `1px solid ${colors.gray3}`,
});

export const configsContainer = style([
  sprinkles({
    paddingLeft: 'xs',
    paddingRight: 'xs',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 'sm',
  }),
  {
    margin: '0',
  },
]);

export const configTitle = style([
  sprinkles({
    fontSize: 'base',
    borderRadius: 'xs',
    paddingLeft: 'sm',
    paddingRight: 'sm',
  }),
  {
    height: '100%',
    border: `1px solid ${colors.gray5}`,
    outline: 'none',
    '::placeholder': {
      color: colors.gray7,
    },
    ':focus': {
      borderColor: colors.accent9,
    },
  },
]);

export const updateNameStatus = style({
  color: colors.gray9,
  fontSize: '0.875rem',
});
