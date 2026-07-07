import { User, Plus, Upload } from 'lucide-react';
import type { Patient } from '../types';

interface PatientHeaderProps {
  patient: Patient;
  onAddRecord?: () => void;
  onInbodyUpload?: () => void;
}

export default function PatientHeader({ patient, onAddRecord, onInbodyUpload }: PatientHeaderProps) {
  return (
    <div className="panel-card p-5 flex items-center justify-between">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <div>
          <div className="text-xl font-bold text-gray-900">
            {patient.name} ({patient.sex}성)
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span>{patient.chartNo}</span>
            <span>
              {patient.birth} ({patient.ageAtToday}세)
            </span>
          </div>
        </div>
        <div className="ml-6 flex items-center gap-6 text-sm">
          <div>
            <div className="text-xs text-gray-400">키</div>
            <div className="font-bold text-gray-900">{patient.heightCm} cm</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">시작일</div>
            <div className="font-bold text-gray-900">{patient.startDate}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">총 방문</div>
            <div className="font-bold text-gray-900">{patient.totalVisits}회</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">최근 방문일</div>
            <div className="font-bold text-gray-900">{patient.lastVisitDate.replace(/-/g, '.')}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onAddRecord}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          오늘 기록 추가
        </button>
        <button
          type="button"
          onClick={onInbodyUpload}
          className="btn-outline"
        >
          <Upload className="w-4 h-4" />
          인바디 기록지 업로드
        </button>
      </div>
    </div>
  );
}
