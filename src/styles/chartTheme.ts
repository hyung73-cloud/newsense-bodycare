export const CHART_COLORS = {
  weight: '#2563EB',
  muscle: '#16A34A',
  bodyFat: '#F59E0B',
  waist: '#A855F7',
  grid: '#F3F4F6',
  axis: '#9CA3AF',
  success: '#16A34A',
  primary: '#2563EB',
  danger: '#EF4444',
} as const;

export const chartAxisTick = { fontSize: 10, fill: CHART_COLORS.axis };
export const chartLegendStyle = { fontSize: 11, color: '#4B5563', paddingTop: 8 };
export const chartTooltipProps = {
  contentStyle: { borderRadius: 8 },
  wrapperClassName: 'chart-tooltip',
  labelStyle: { color: '#111827', fontWeight: 600 },
} as const;
