import { Link } from 'react-router-dom';
import type { Patient, Visit } from '../types';

interface RecentPatientCardProps {
  patient: Patient;
  visit: Visit;
  imageUrl: string;
  weightKg: number;
  waistCm: number;
  bodyFatPct: number;
}

export default function RecentPatientCard({
  patient,
  visit,
  imageUrl,
  weightKg,
  waistCm,
  bodyFatPct,
}: RecentPatientCardProps) {
  return (
    <div className="panel-card p-3.5 flex flex-col h-full border border-gray-100">
      <div className="flex gap-3 flex-1">
        <div className="w-16 h-[74px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 ring-1 ring-gray-200">
          {imageUrl ? (
            <img src={imageUrl} alt={patient.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Image</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate tracking-tight">
            {patient.name}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">{patient.chartNo}</div>
          <div className="text-[10px] text-gray-500">{visit.date.replace(/-/g, '.')}</div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-center">
            <div className="rounded-md bg-gray-50 py-1">
              <div className="text-[9px] text-gray-400">체중</div>
              <div className="text-xs font-bold text-gray-900">{weightKg}</div>
            </div>
            <div className="rounded-md bg-gray-50 py-1">
              <div className="text-[9px] text-gray-400">허리</div>
              <div className="text-xs font-bold text-gray-900">{waistCm}</div>
            </div>
            <div className="rounded-md bg-gray-50 py-1">
              <div className="text-[9px] text-gray-400">체지방</div>
              <div className="text-xs font-bold text-gray-900">{bodyFatPct}%</div>
            </div>
          </div>
        </div>
      </div>
      <Link
        to={`/patient/${patient.id}`}
        className="mt-2.5 w-full text-center text-xs text-primary border border-primary/30 rounded-lg py-1.5 hover:bg-blue-50 transition-colors font-medium"
      >
        환자 프로파일 →
      </Link>
    </div>
  );
}
