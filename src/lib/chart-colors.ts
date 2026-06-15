/**
 * Chart palette — concrete hex that mirrors the --chart-* design tokens.
 * Recharts sets fill/stroke as SVG attributes, where CSS var() does NOT
 * resolve, so these must be real colors (kept in sync with index.css).
 */
export const CHART = {
  emerald: '#2B8265',       // --chart-1  (brand / primary series)
  emeraldDeep: '#1F5141',   // principal, dark base
  emeraldBright: '#30A66F', // positive / optimistic
  gold: '#EC9C13',          // --chart-2  (highlight / interest)
  red: '#DB2424',           // --chart-3  (negative / pessimistic)
  terracotta: '#C6682A',    // --chart-4  (neutral / average)
  teal: '#297A72',          // --chart-5
  violet: '#7854B6',
} as const;

/** Ordered palette for series with N tracks (mortgage mix, etc.). */
export const CHART_SERIES = [
  CHART.emerald,
  CHART.terracotta,
  CHART.gold,
  CHART.teal,
  CHART.violet,
];
