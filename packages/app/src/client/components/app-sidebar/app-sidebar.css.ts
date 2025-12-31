import { spacing, sprinkles } from '@ui';
import { style } from '@vanilla-extract/css';

export const comingSoonTooltip = style({
  display: 'flex',
  gap: spacing.xs,
  height: spacing.md,
  lineHeight: spacing.md,
});

export const sidebarSectionTitle = style([
  sprinkles({
    fontSize: 'xs',
    fontFamily: 'mono',
    color: 'gray9',
    paddingLeft: 'xs',
    paddingRight: 'xs',
  }),
  {
    fontWeight: 500,
    letterSpacing: '0.05em',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    transition: 'opacity 0.2s ease-in-out',
  },
]);

export const sidebarSectionTitleHidden = style({
  opacity: 0,
});
