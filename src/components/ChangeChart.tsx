import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS, chartAxisTick, chartLegendStyle, chartTooltipProps } from '../styles/chartTheme';

interface ChangeChartProps {
  data: {
    date: string;
    weight: number;
    muscle: number;
    bodyFat: number;
    waist: number;
  }[];
  variant?: 'card' | 'embedded';
}

export default function ChangeChart({ data, variant = 'card' }: ChangeChartProps) {
  const [period, setPeriod] = useState('all');

  const content = (
    <>
      <div className={`flex items-center justify-between ${variant === 'card' ? 'mb-4' : 'mb-3'}`}>
        {variant === 'card' ? (
          <h3 className="panel-title">변화 그래프</h3>
        ) : (
          <h4 className="text-xs font-bold text-gray-700">변화 그래프</h4>
        )}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-xs border border-gray-300 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">전체 기간</option>
          <option value="3m">최근 3개월</option>
          <option value="6m">최근 6개월</option>
        </select>
      </div>
      <div className={variant === 'card' ? 'h-52' : 'h-48'}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis dataKey="date" tick={chartAxisTick} />
            <YAxis yAxisId="left" tick={chartAxisTick} />
            <YAxis yAxisId="right" orientation="right" tick={chartAxisTick} />
            <Tooltip {...chartTooltipProps} />
            <Legend wrapperStyle={chartLegendStyle} iconType="circle" />
            <Line yAxisId="left" type="monotone" dataKey="weight" name="체중(kg)" stroke={CHART_COLORS.weight} strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="left" type="monotone" dataKey="muscle" name="골격근(kg)" stroke={CHART_COLORS.muscle} strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="right" type="monotone" dataKey="bodyFat" name="체지방(%)" stroke={CHART_COLORS.bodyFat} strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="right" type="monotone" dataKey="waist" name="허리(cm)" stroke={CHART_COLORS.waist} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );

  if (variant === 'embedded') {
    return <div className="border-t border-gray-100 pt-4">{content}</div>;
  }

  return <div className="panel-card p-5 h-full">{content}</div>;
}
