import { useState, type ReactNode } from 'react';
import { Droplets, Sparkles, Scissors, Pill, TestTube, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [drawerKey, setDrawerKey] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const openTag = (key: string) => {
    setShowAll(false);
    setDrawerKey(key);
  };

  const openAll = () => {
    setDrawerKey(null);
    setShowAll(true);
  };

  const closeDrawer = () => {
    setDrawerKey(null);
    setShowAll(false);
  };

  const drawerOpen = drawerKey !== null || showAll;
  const activeTag = tags.find((t) => t.key === drawerKey);

  const drawerPatients = showAll
    ? tags
        .flatMap((t) => getPatientsByProcedure(t.key).map((p) => ({ patient: p, tagLabel: t.label })))
        .filter((entry, i, arr) => arr.findIndex((x) => x.patient.id === entry.patient.id) === i)
    : drawerKey
      ? getPatientsByProcedure(drawerKey).map((p) => ({ patient: p, tagLabel: activeTag?.label ?? '' }))
      : [];

  return (
    <div className="panel-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="panel-title">시술/검사 환자 관리</h3>
        <button
          type="button"
          onClick={openAll}
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
            onClick={() => openTag(tag.key)}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all shadow-sm hover:-translate-y-0.5 ${
              colorMap[tag.key]
            } ${drawerKey === tag.key ? 'ring-2 ring-primary ring-offset-1' : ''}`}
          >
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {tag.count}
            </span>
            {iconMap[tag.key]}
            <span className="text-xs font-medium text-center leading-tight">{tag.label}</span>
          </button>
        ))}
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={closeDrawer}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-md h-full bg-white shadow-elevated flex flex-col animate-in slide-in-from-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">
                  {showAll ? '전체 시술/검사 환자' : activeTag?.label}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{drawerPatients.length}명</p>
              </div>
              <button type="button" onClick={closeDrawer} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {drawerPatients.map(({ patient, tagLabel }) => (
                <Link
                  key={patient.id}
                  to={`/patient/${patient.id}`}
                  onClick={closeDrawer}
                  className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {patient.chartNo}
                      {patient.phone && ` · ${patient.phone}`}
                      {showAll && tagLabel && ` · ${tagLabel}`}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              ))}
              {drawerPatients.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-8">해당 환자가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
