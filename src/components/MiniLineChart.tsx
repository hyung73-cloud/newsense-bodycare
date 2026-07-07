import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface MiniLineChartProps {
  title: string;
  data: { date: string; value: number }[];
  color?: string;
  unit?: string;
}

export default function MiniLineChart({
  title,
  data,
  color = '#2563EB',
  unit = '',
}: MiniLineChartProps) {
  return (
    <div className="bg-white rounded-card shadow-card p-4">
      <h4 className="text-xs font-bold text-gray-700 mb-2">{title}</h4>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
              formatter={(v: number) => [`${v}${unit}`, '']}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, fill: color }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
