import { User, Plus, Upload, Phone, Camera } from 'lucide-react';
import type { Patient } from '../types';
import FileUploadButton from './FileUploadButton';

export type PhotoUploadSlot = 'prev' | 'today';

interface PatientHeaderProps {
  patient: Patient;
  avatarUrl?: string;
  onAddRecord?: () => void;
  onInbodyUpload?: () => void;
  onPhotoUpload?: (type: 'front' | 'side', file: File, slot: PhotoUploadSlot) => void;
  onClearPhotos?: () => void;
}

export default function PatientHeader({
  patient,
  avatarUrl,
  onAddRecord,
  onInbodyUpload,
  onPhotoUpload,
  onClearPhotos,
}: PatientHeaderProps) {
  return (
    <div className="panel-card p-5 flex items-center justify-between">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden ring-1 ring-gray-200">
          {avatarUrl ? (
            <img src={avatarUrl} alt={patient.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-8 h-8 text-gray-400" />
          )}
        </div>
        <div>
          <div className="text-xl font-bold text-gray-900">{patient.name}</div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span>{patient.chartNo}</span>
            <span>
              {patient.birth} ({patient.ageAtToday}세)
            </span>
            {patient.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {patient.phone}
              </span>
            )}
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
            <div className="font-bold text-gray-900">{patient.lastVisitDate ? patient.lastVisitDate.replace(/-/g, '.') : '-'}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <button type="button" onClick={onAddRecord} className="btn-primary">
          <Plus className="w-4 h-4" />
          오늘 메모
        </button>
        {onPhotoUpload && (
          <>
            <FileUploadButton onFile={(file) => onPhotoUpload('front', file, 'prev')} className="btn-outline">
              <Camera className="w-4 h-4" />
              그전 정면
            </FileUploadButton>
            <FileUploadButton onFile={(file) => onPhotoUpload('side', file, 'prev')} className="btn-outline">
              <Camera className="w-4 h-4" />
              그전 측면
            </FileUploadButton>
            <FileUploadButton onFile={(file) => onPhotoUpload('front', file, 'today')} className="btn-outline">
              <Camera className="w-4 h-4" />
              오늘 정면
            </FileUploadButton>
            <FileUploadButton onFile={(file) => onPhotoUpload('side', file, 'today')} className="btn-outline">
              <Camera className="w-4 h-4" />
              오늘 측면
            </FileUploadButton>
          </>
        )}
        {onClearPhotos && (
          <button
            type="button"
            onClick={onClearPhotos}
            className="text-xs text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50"
          >
            체형 사진 초기화
          </button>
        )}
        <button type="button" onClick={onInbodyUpload} className="btn-outline">
          <Upload className="w-4 h-4" />
          기록지 업로드
        </button>
      </div>
    </div>
  );
}
