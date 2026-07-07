import { TrendingDown, TrendingUp, Activity } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  unit: string;
  change: number;
  changeUnit: string;
  status: string;
  icon: 'fat' | 'muscle' | 'visceral';
  positiveIsGood?: boolean;
}

const icons = {
  fat: TrendingDown,
  muscle: TrendingUp,
  visceral: Activity,
};

export default function KpiCard({
  title,
  value,
  unit,
  change,
  changeUnit,
  status,
  icon,
  positiveIsGood = true,
}: KpiCardProps) {
  const Icon = icons[icon];
  const isGood = positiveIsGood ? change < 0 : change > 0;
  const changeColor = change === 0 ? 'text-gray-400' : isGood ? 'text-green-600' : 'text-red-500';
  const changeSign = change > 0 ? '+' : '';

  return (
    <div className="panel-card p-4 border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-500 mb-1">{title}</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            <span className="text-sm text-gray-500">{unit}</span>
          </div>
          <div className={`text-xs mt-1 font-medium ${changeColor}`}>
            {changeSign}
            {change}
            {changeUnit} vs 이전
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
          <Icon className={`w-5 h-5 ${changeColor}`} />
        </div>
      </div>
      <div className="mt-2 text-[10px] text-gray-400 bg-gray-50 rounded px-2 py-1 inline-block">
        {status}
      </div>
    </div>
  );
}
