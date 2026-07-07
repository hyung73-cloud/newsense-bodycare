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

interface ChangeChartProps {
  data: {
    date: string;
    weight: number;
    muscle: number;
    bodyFat: number;
    waist: number;
  }[];
}

export default function ChangeChart({ data }: ChangeChartProps) {
  const [period, setPeriod] = useState('all');

  return (
    <div className="bg-white rounded-card shadow-card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-sm">변화 그래프</h3>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600"
        >
          <option value="all">전체 기간</option>
          <option value="3m">최근 3개월</option>
          <option value="6m">최근 6개월</option>
        </select>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line yAxisId="left" type="monotone" dataKey="weight" name="체중(kg)" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="left" type="monotone" dataKey="muscle" name="골격근(kg)" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="right" type="monotone" dataKey="bodyFat" name="체지방(%)" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="right" type="monotone" dataKey="waist" name="허리(cm)" stroke="#A855F7" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
