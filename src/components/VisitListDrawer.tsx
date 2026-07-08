import { X, ChevronRight, Camera, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Patient, Visit } from '../types';

interface VisitListDrawerProps {
  open: boolean;
  title: string;
  visits: (Visit & { patient: Patient })[];
  onClose: () => void;
}

export default function VisitListDrawer({ open, title, visits, onClose }: VisitListDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-md h-full bg-white shadow-elevated flex flex-col animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{visits.length}명</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {visits.map((v) => (
            <Link
              key={v.id}
              to={`/patient/${v.patient.id}`}
              onClick={onClose}
              className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {v.patient.name}
                  <span className="text-xs text-gray-400 ml-2">
                    {v.patient.sex}/{v.patient.ageAtToday}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                  <span>{v.patient.chartNo}</span>
                  <span className="inline-flex items-center gap-0.5">
                    <Camera className={`w-3 h-3 ${v.photoUploaded ? 'text-green-500' : 'text-gray-300'}`} />
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <FileText className={`w-3 h-3 ${v.inbodyUploaded ? 'text-green-500' : 'text-gray-300'}`} />
                  </span>
                  <span
                    className={
                      v.status === '완료'
                        ? 'text-green-600'
                        : v.status === '진행중'
                          ? 'text-blue-600'
                          : 'text-red-500'
                    }
                  >
                    {v.status}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </Link>
          ))}
          {visits.length === 0 && (
            <p className="text-center text-xs text-gray-400 py-8">해당 환자가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
