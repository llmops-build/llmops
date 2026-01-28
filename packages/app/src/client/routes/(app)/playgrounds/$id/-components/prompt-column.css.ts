import { colors, spacing, sprinkles } from '@ui';
import { style } from '@vanilla-extract/css';

export const columnCard = style({
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: colors.gray1,
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.xs,
  width: '400px',
  flexShrink: 0,
});

export const columnHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.sm} ${spacing.md}`,
  borderBottom: `1px solid ${colors.gray4}`,
});

export const columnHeaderLeft = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
});

export const columnIndicator = style({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: colors.gray8,
});

export const columnNameInput = style([
  sprinkles({
    fontSize: 'sm',
    color: 'gray12',
  }),
  {
    border: 'none',
    backgroundColor: 'transparent',
    fontWeight: 500,
    outline: 'none',
    padding: 0,
    minWidth: '100px',
    '::placeholder': {
      color: colors.gray9,
    },
    ':hover': {
      backgroundColor: colors.gray2,
    },
    ':focus': {
      backgroundColor: colors.gray3,
    },
  },
]);

export const columnHeaderRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
});

export const columnHeaderAction = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing.xs,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: spacing.xs,
  cursor: 'pointer',
  color: colors.gray9,
  ':hover': {
    backgroundColor: colors.gray3,
    color: colors.gray11,
  },
});

export const dragHandle = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing.xs,
  color: colors.gray7,
  cursor: 'grab',
  ':hover': {
    color: colors.gray9,
  },
  ':active': {
    cursor: 'grabbing',
  },
});

export const modelSelectorRow = style({
  display: 'flex',
  alignItems: 'center',
  padding: `${spacing.sm} ${spacing.md}`,
  borderBottom: `1px solid ${colors.gray4}`,
  gap: spacing.sm,
});

export const columnBody = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  overflow: 'auto',
});

export const messagesContainer = style({
  display: 'flex',
  flexDirection: 'column',
  padding: spacing.sm,
  gap: spacing.sm,
});

export const actionsRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  padding: `${spacing.sm}`,
  flexWrap: 'wrap',
});

export const actionButton = style([
  sprinkles({
    fontSize: 'sm',
    borderRadius: 'xs',
    paddingLeft: 'sm',
    paddingRight: 'sm',
  }),
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    height: '2rem',
    backgroundColor: 'transparent',
    border: `1px dashed ${colors.gray6}`,
    cursor: 'pointer',
    color: colors.gray11,
    transition: 'all 150ms ease',
    ':hover': {
      backgroundColor: colors.gray2,
      borderColor: colors.gray8,
      color: colors.gray12,
    },
  },
]);

export const columnFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: spacing['xl'],
  borderTop: `1px solid ${colors.gray4}`,
  color: colors.gray9,
  fontSize: '13px',
});

export const footerLeft = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
});

export const footerRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
  color: colors.gray8,
  fontSize: '12px',
});
