import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { colors, spacing } from '../../tokens';

export const tabsRoot = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
});

export const tabsRootHorizontal = style({
  flexDirection: 'column',
});

export const tabsRootVertical = style({
  flexDirection: 'row',
});

export const tabsList = style({
  display: 'flex',
  gap: spacing.xs,
  borderBottom: `1px solid ${colors.gray6}`,
  position: 'relative',
});

export const tabsListVertical = style({
  flexDirection: 'column',
  borderBottom: 'none',
  borderRight: `1px solid ${colors.gray6}`,
});

export const tabRecipe = recipe({
  base: {
    padding: `${spacing.sm} ${spacing.md}`,
    border: 'none',
    backgroundColor: 'transparent',
    color: colors.gray11,
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    position: 'relative',
    transition: 'color 0.2s ease',
    selectors: {
      '&:hover': {
        color: colors.gray12,
        backgroundColor: colors.gray3,
      },
      '&[data-active]': {
        color: colors.accent11,
      },
      '&[data-disabled]': {
        color: colors.gray8,
        cursor: 'not-allowed',
        opacity: 0.5,
      },
    },
  },
  variants: {
    variant: {
      default: {},
      pills: {
        borderRadius: spacing.xs,
        selectors: {
          '&[data-active]': {
            backgroundColor: colors.accent3,
          },
        },
      },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export const tabIndicator = style({
  position: 'absolute',
  bottom: -1,
  left: 'var(--active-tab-left)',
  width: 'var(--active-tab-width)',
  height: 2,
  backgroundColor: colors.accent9,
  transition: 'all 0.2s ease',
});

export const tabIndicatorVertical = style({
  bottom: 'auto',
  left: 'auto',
  right: -1,
  top: 'var(--active-tab-top)',
  width: 2,
  height: 'var(--active-tab-height)',
});

export const tabPanel = style({
  padding: spacing.md,
  selectors: {
    '&[data-hidden]': {
      display: 'none',
    },
  },
});

export type TabVariants = NonNullable<Parameters<typeof tabRecipe>[0]>;
