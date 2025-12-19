import { colors, spacing, sprinkles } from '@llmops/ui';
import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { calc } from '@vanilla-extract/css-utils';

export const headerStyles = style({
  padding: `${spacing.sm} ${spacing.xs}`,
  height: spacing['2xl'],
  display: 'flex',
  borderBottom: `1px solid ${colors.gray4}`,
  position: 'sticky',
  left: '0',
  top: '0',
  backgroundColor: colors.background,
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
    position: 'relative',
  },
]);

export const configTitleInput = style([
  sprinkles({
    fontSize: 'sm',
    borderRadius: 'xs',
    paddingLeft: 'sm',
    paddingRight: 'sm',
    backgroundColor: 'gray1',
    color: 'gray11',
  }),
  {
    height: spacing['xl'],
    border: `1px solid ${colors.gray4}`,
    outline: 'none',
    ':-moz-placeholder': {
      color: colors.gray7,
    },
    '::-webkit-input-placeholder': {
      color: colors.gray7,
    },
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

export const configTabsContainer = style([
  {
    borderBottom: `1px solid ${colors.gray4}`,
    height: spacing['2xl'],
    display: 'flex',
    alignItems: 'center',
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
    gap: spacing.sm,
    position: 'sticky',
    top: spacing['2xl'],
  },
]);

export const configTab = recipe({
  base: [
    sprinkles({
      display: 'flex',
      padding: 'xs',
      fontSize: 'sm',
      color: 'gray11',
      fontFamily: 'mono',
    }),
    {
      lineHeight: calc.multiply(spacing.md, 1.25),
      alignItems: 'center',
      gap: spacing.md,
      borderRadius: '0.25rem',
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      border: 'none',
      width: 'auto',
      fontWeight: 400,
      textAlign: 'left',
      color: colors.gray9,
      backgroundColor: 'transparent',
      paddingLeft: spacing.sm,
      paddingRight: spacing.sm,
      selectors: {
        '&:hover': {
          backgroundColor: colors.gray3,
        },
        '&.active': {
          backgroundColor: colors.gray4,
          color: colors.gray11,
        },
      },
    },
  ],
});
