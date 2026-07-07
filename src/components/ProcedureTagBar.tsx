import { useState, type ReactNode } from 'react';
import { Droplets, Sparkles, Scissors, Pill, TestTube, X } from 'lucide-react';
import { getPatientsByProcedure } from '../api/mock';
import type { ProcedureTag } from '../types';

const iconMap: Record<string, ReactNode> = {
  arginine: <Droplets className="w-6 h-6" />,
  carboxy: <Sparkles className="w-6 h-6" />,
  liposuction: <Scissors className="w-6 h-6" />,
  cnu: <Pill className="w-6 h-6" />,
  hba1c: <TestTube className="w-6 h-6" />,
};

const colorMap: Record<string, string> = {
  arginine: 'bg-blue-50 text-blue-600 border-blue-200',
  carboxy: 'bg-purple-50 text-purple-600 border-purple-200',
  liposuction: 'bg-orange-50 text-orange-600 border-orange-200',
  cnu: 'bg-green-50 text-green-600 border-green-200',
  hba1c: 'bg-cyan-50 text-cyan-600 border-cyan-200',
};

interface ProcedureTagBarProps {
  tags: ProcedureTag[];
}

export default function ProcedureTagBar({ tags }: ProcedureTagBarProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const selectedPatients = selected ? getPatientsByProcedure(selected) : [];

  return (
    <div className="panel-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="panel-title">시술/검사 환자 관리</h3>
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-primary hover:underline font-medium"
        >
          전체 시술/검사 환자 보기 →
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {tags.map((tag) => (
          <button
            key={tag.key}
            type="button"
            onClick={() => setSelected(selected === tag.key ? null : tag.key)}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all shadow-sm ${
              colorMap[tag.key]
            } ${selected === tag.key ? 'ring-2 ring-primary ring-offset-1' : ''}`}
          >
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {tag.count}
            </span>
            {iconMap[tag.key]}
            <span className="text-xs font-medium text-center leading-tight">{tag.label}</span>
          </button>
        ))}
      </div>

      {(selected || showAll) && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {showAll ? '전체 시술/검사 환자' : tags.find((t) => t.key === selected)?.label} 목록
            </span>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setShowAll(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(showAll
              ? tags.flatMap((t) => getPatientsByProcedure(t.key))
              : selectedPatients
            )
              .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
              .map((p) => (
                <span
                  key={p.id}
                  className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1"
                >
                  {p.name} ({p.chartNo})
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
