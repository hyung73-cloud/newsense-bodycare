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
    <div className="bg-white rounded-card shadow-card p-3 flex flex-col h-full">
      <div className="flex gap-2.5 flex-1">
        <div className="w-16 h-[72px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          <img src={imageUrl} alt={patient.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">
            {patient.name} ({patient.sex}/{patient.ageAtToday})
          </div>
          <div className="text-[10px] text-gray-500">{patient.chartNo}</div>
          <div className="text-[10px] text-gray-500">{visit.date.replace(/-/g, '.')}</div>
          <div className="mt-1.5 grid grid-cols-3 gap-0.5 text-center">
            <div>
              <div className="text-[9px] text-gray-400">체중</div>
              <div className="text-xs font-bold text-gray-900">{weightKg}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-400">허리</div>
              <div className="text-xs font-bold text-gray-900">{waistCm}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-400">체지방</div>
              <div className="text-xs font-bold text-gray-900">{bodyFatPct}%</div>
            </div>
          </div>
        </div>
      </div>
      <Link
        to={`/patient/${patient.id}`}
        className="mt-2 w-full text-center text-xs text-primary border border-primary/30 rounded-lg py-1.5 hover:bg-blue-50 transition-colors"
      >
        환자 프로파일 →
      </Link>
    </div>
  );
}
