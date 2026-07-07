import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { ProgressStats } from '../types';

interface ProgressDonutProps {
  stats: ProgressStats;
  className?: string;
}

const COLORS = ['#22C55E', '#2563EB', '#EF4444'];

export default function ProgressDonut({ stats, className = '' }: ProgressDonutProps) {
  const data = [
    { name: '입력 완료', value: stats.completed, pct: ((stats.completed / stats.total) * 100).toFixed(1) },
    { name: '입력 진행중', value: stats.inProgress, pct: ((stats.inProgress / stats.total) * 100).toFixed(1) },
    { name: '입력 미완료', value: stats.incomplete, pct: ((stats.incomplete / stats.total) * 100).toFixed(1) },
  ];

  return (
    <div className={`panel-card p-4 flex flex-col ${className}`}>
      <h3 className="panel-title mb-2">진행 현황</h3>
      <div className="relative flex-1 min-h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _name, props) => [`${value}명`, props.payload?.name ?? '']}
              contentStyle={{ borderRadius: 8 }}
              wrapperClassName="chart-tooltip"
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-[10px] text-gray-500">전체</div>
            <div className="text-base font-bold text-gray-900">{stats.total}명</div>
          </div>
        </div>
      </div>
      <div className="space-y-1.5 mt-2">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full ring-1 ring-black/5" style={{ backgroundColor: COLORS[i] }} />
              {item.name}
            </span>
            <span className="font-semibold text-gray-900">
              {item.value}명 ({item.pct}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
