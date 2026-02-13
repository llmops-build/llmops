import { style } from '@vanilla-extract/css';
import { colors, spacing, sprinkles } from '@ui';

export const traceDetailContainer = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
});

export const traceDetailHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: `${spacing.md} ${spacing.md} ${spacing.sm}`,
  flexShrink: 0,
  borderBottom: `1px solid ${colors.gray4}`,
});

export const traceDetailHeaderLeft = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
  minWidth: 0,
  flex: 1,
});

export const traceDetailTitle = style([
  sprinkles({
    fontFamily: 'mono',
    fontSize: 'sm',
    color: 'gray12',
  }),
  {
    fontWeight: 600,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
]);

export const traceDetailId = style([
  sprinkles({
    fontFamily: 'mono',
    fontSize: 'xs',
    color: 'gray9',
  }),
  {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
]);

export const metricsRow = style({
  display: 'flex',
  gap: spacing.lg,
  padding: `${spacing.sm} ${spacing.md}`,
  borderBottom: `1px solid ${colors.gray4}`,
  flexShrink: 0,
  flexWrap: 'wrap',
});

export const metricItem = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const metricLabel = style([
  sprinkles({
    fontFamily: 'mono',
    fontSize: 'xs',
    color: 'gray9',
  }),
  {
    letterSpacing: '0.03em',
  },
]);

export const metricValue = style([
  sprinkles({
    fontFamily: 'mono',
    fontSize: 'sm',
    color: 'gray12',
  }),
  {
    fontWeight: 500,
  },
]);

export const scrollArea = style({
  flex: 1,
  overflowY: 'auto',
  minHeight: 0,
});

// Waterfall section
export const waterfallSection = style({
  padding: `${spacing.sm} ${spacing.md}`,
  borderBottom: `1px solid ${colors.gray4}`,
});

export const waterfallSectionTitle = style([
  sprinkles({
    fontFamily: 'mono',
    fontSize: 'xs',
    color: 'gray9',
  }),
  {
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
]);

export const spanRow = style({
  display: 'flex',
  alignItems: 'stretch',
  gap: spacing.sm,
  cursor: 'pointer',
  borderRadius: '4px',
  transition: 'background-color 0.1s ease',
  minHeight: '28px',
  ':hover': {
    backgroundColor: colors.gray3,
  },
});

export const spanRowSelected = style({
  backgroundColor: colors.gray3,
});

export const spanNameColumn = style([
  sprinkles({
    fontFamily: 'mono',
    fontSize: 'xs',
    color: 'gray11',
  }),
  {
    flexShrink: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
  },
]);

export const spanBarColumn = style({
  flex: 1,
  position: 'relative',
  minWidth: 0,
});

export const spanBar = style({
  position: 'absolute',
  top: '2px',
  bottom: '2px',
  minWidth: '2px',
  transition: 'opacity 0.1s ease',
});

// Span type colors
export const spanBarGeneration = style({
  backgroundColor: '#3b82f6',
});

export const spanBarAgent = style({
  backgroundColor: '#a78bfa',
});

export const spanBarTool = style({
  backgroundColor: '#34d399',
});

export const spanBarGuardrail = style({
  backgroundColor: '#fb923c',
});

export const spanBarEmbedding = style({
  backgroundColor: '#22d3ee',
});

export const spanBarDefault = style({
  backgroundColor: colors.gray8,
});

export const spanBarError = style({
  backgroundColor: colors.error9,
});

export const spanDuration = style([
  sprinkles({
    fontFamily: 'mono',
    fontSize: 'xs',
    color: 'gray9',
  }),
  {
    flexShrink: 0,
    width: '60px',
    textAlign: 'right',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
]);

// Span detail section
export const spanDetailSection = style({
  padding: spacing.md,
});

export const spanDetailHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spacing.sm,
});

export const spanDetailTitle = style([
  sprinkles({
    fontFamily: 'mono',
    fontSize: 'sm',
    color: 'gray12',
  }),
  {
    fontWeight: 600,
  },
]);

export const spanDetailMeta = style({
  display: 'flex',
  gap: spacing.md,
  flexWrap: 'wrap',
  marginBottom: spacing.md,
});

export const spanDetailMetaItem = style([
  sprinkles({
    fontFamily: 'mono',
    fontSize: 'xs',
  }),
  {
    display: 'flex',
    gap: spacing.xs,
  },
]);

export const spanDetailMetaLabel = style([
  sprinkles({ color: 'gray9' }),
]);

export const spanDetailMetaValue = style([
  sprinkles({ color: 'gray11' }),
]);

export const collapsibleHeader = style([
  sprinkles({
    fontFamily: 'mono',
    fontSize: 'xs',
    color: 'gray10',
  }),
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    cursor: 'pointer',
    padding: `${spacing.xs} 0`,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    fontWeight: 500,
    userSelect: 'none',
    ':hover': {
      color: colors.gray12,
    },
  },
]);

export const jsonBlock = style([
  sprinkles({
    fontFamily: 'mono',
    fontSize: 'xs',
    color: 'gray11',
  }),
  {
    backgroundColor: colors.gray2,
    border: `1px solid ${colors.gray4}`,
    borderRadius: spacing.xs,
    padding: spacing.sm,
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '300px',
    overflowY: 'auto',
    lineHeight: 1.5,
    margin: `${spacing.xs} 0 ${spacing.sm}`,
  },
]);

export const attributeRow = style([
  sprinkles({
    fontFamily: 'mono',
    fontSize: 'xs',
  }),
  {
    display: 'flex',
    padding: `3px 0`,
    borderBottom: `1px solid ${colors.gray3}`,
    selectors: {
      '&:last-child': {
        borderBottom: 'none',
      },
    },
  },
]);

export const attributeKey = style([
  sprinkles({ color: 'gray9' }),
  {
    flexShrink: 0,
    width: '45%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    paddingRight: spacing.sm,
  },
]);

export const attributeValue = style([
  sprinkles({ color: 'gray11' }),
  {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
]);

export const eventsContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
  margin: `${spacing.xs} 0 ${spacing.sm}`,
});

export const eventItem = style([
  sprinkles({
    fontFamily: 'mono',
    fontSize: 'xs',
  }),
  {
    display: 'flex',
    gap: spacing.sm,
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: colors.gray2,
    borderRadius: '4px',
    border: `1px solid ${colors.gray4}`,
  },
]);

export const eventTime = style([
  sprinkles({ color: 'gray9' }),
  { flexShrink: 0 },
]);

export const eventName = style([
  sprinkles({ color: 'gray11' }),
  { fontWeight: 500 },
]);

export const emptyDetail = style([
  sprinkles({
    fontFamily: 'mono',
    fontSize: 'xs',
    color: 'gray8',
  }),
  {
    fontStyle: 'italic',
    padding: `${spacing.xs} 0`,
  },
]);

export const loadingContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
});
