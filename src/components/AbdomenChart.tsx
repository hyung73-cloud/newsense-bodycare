import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { chartTooltipProps } from '../styles/chartTheme';

interface AbdomenChartProps {
  data: { date: string; outer: number; inner: number; fat: number }[];
}

export default function AbdomenChart({ data }: AbdomenChartProps) {
  return (
    <div className="panel-card p-5 h-full flex flex-col">
      <div className="mb-3">
        <h3 className="panel-title">복부 측정 변화</h3>
        <p className="text-xs text-gray-400 mt-1">방문별 바깥둘레 · 안쪽둘레 · 지방두께</p>
      </div>
      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400 py-10">
          체형결과지를 업로드하면 방문별 그래프가 표시됩니다.
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={32} />
              <Tooltip {...chartTooltipProps} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="outer"
                name="바깥둘레(cm)"
                stroke="#2563EB"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="inner"
                name="안쪽둘레(cm)"
                stroke="#059669"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="fat"
                name="지방두께(mm)"
                stroke="#D97706"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
