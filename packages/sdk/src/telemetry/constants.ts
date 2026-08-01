export const COST_SUMMARY_GROUP_BY = [
  'day',
  'hour',
  'model',
  'provider',
  'endpoint',
  'tags',
] as const;

export type CostSummaryGroupBy = (typeof COST_SUMMARY_GROUP_BY)[number];
