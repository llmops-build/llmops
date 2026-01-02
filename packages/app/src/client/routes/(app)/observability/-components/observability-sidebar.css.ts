import { style } from '@vanilla-extract/css';
import { colors, spacing, sprinkles } from '@ui';

export const observabilityLayout = style({
  display: 'flex',
  height: '100%',
});

export const observabilitySidebar = style([
  sprinkles({
    display: 'flex',
    flexDirection: 'column',
    gap: 'sm',
    padding: 'sm',
    borderColor: 'gray4',
  }),
  {
    width: '200px',
    borderRight: `1px solid ${colors.gray4}`,
    flexShrink: 0,
  },
]);

export const observabilitySidebarSection = style([
  sprinkles({
    display: 'flex',
    flexDirection: 'column',
    gap: 'xs',
  }),
]);

export const observabilitySidebarSectionTitle = style([
  sprinkles({
    fontSize: 'xs',
    fontFamily: 'mono',
    color: 'gray9',
    padding: 'xs',
  }),
  {
    fontWeight: 500,
    letterSpacing: '0.05em',
  },
]);

export const observabilitySidebarItem = style([
  sprinkles({
    display: 'flex',
    padding: 'xs',
    fontSize: 'sm',
    color: 'gray11',
    fontFamily: 'mono',
  }),
  {
    lineHeight: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: '0.25rem',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    border: 'none',
    width: '100%',
    fontWeight: 400,
    textAlign: 'left',
    color: colors.gray9,
    backgroundColor: 'transparent',
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
]);

export const observabilityContent = style([
  sprinkles({
    padding: 'md',
  }),
  {
    flex: 1,
    overflowY: 'auto',
  },
]);
