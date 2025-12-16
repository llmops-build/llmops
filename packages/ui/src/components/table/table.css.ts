import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { colors, spacing } from '../../tokens';

export const tableContainer = style({
  width: '100%',
});

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.875rem',
  minWidth: '600px',
});

export const tableHeader = style({
  backgroundColor: colors.background,
  color: colors.gray6,
});

export const tableHeaderCell = style({
  padding: `0 ${spacing.sm}`,
  height: spacing.xl,
  textAlign: 'left',
  fontWeight: 500,
  color: colors.gray8,
  border: `1px solid ${colors.gray3}`,
  userSelect: 'none',
});

export const tableBody = style({
  backgroundColor: colors.background,
});

export const tableRow = recipe({
  base: {
    transition: 'background-color 0.2s',
  },
  variants: {
    interactive: {
      true: {
        cursor: 'pointer',
        selectors: {
          '&:hover': {
            backgroundColor: colors.gray2,
          },
        },
      },
      false: {},
    },
  },
  defaultVariants: {
    interactive: false,
  },
});

export const tableCell = style({
  padding: `0 ${spacing.md}`,
  height: spacing.xl,
  color: colors.gray11 as string,
  border: `1px solid ${colors.gray3}`,
  selectors: {
    '&:first-child': {
      borderLeft: 'none',
    },
    '&:last-child': {
      borderRight: 'none',
    },
  },
});

export const sortButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing.xs,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  color: 'inherit',
  font: 'inherit',
  fontWeight: 500,
  selectors: {
    '&:hover': {
      color: colors.gray12 as string,
    },
  },
});

export type TableRowVariants = NonNullable<Parameters<typeof tableRow>[0]>;
