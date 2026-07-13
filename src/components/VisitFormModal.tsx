import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Visit, VisitStatus } from '../types';
import type { VisitFormData } from '../api/mock';

interface VisitFormModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  initial?: Visit;
  /** 신규 방문 추가 시 기존 수치 유지용(수동 입력 없음 — OCR이 채움) */
  seedMetrics?: Pick<
    VisitFormData,
    'weightKg' | 'waistCm' | 'bodyFatPct' | 'skeletalMuscleKg' | 'visceralLevel'
  >;
  onClose: () => void;
  onSave: (data: VisitFormData) => void;
}

const emptyMetrics = {
  weightKg: 0,
  waistCm: 0,
  bodyFatPct: 0,
  skeletalMuscleKg: 0,
  visceralLevel: 0,
};

export default function VisitFormModal({
  open,
  mode,
  initial,
  seedMetrics,
  onClose,
  onSave,
}: VisitFormModalProps) {
  const [form, setForm] = useState<VisitFormData>({
    ...emptyMetrics,
    doctorNote: '',
    status: '진행중',
    photoUploaded: false,
    inbodyUploaded: false,
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initial) {
      setForm({
        weightKg: initial.weightKg,
        waistCm: initial.waistCm,
        bodyFatPct: initial.bodyFatPct,
        skeletalMuscleKg: initial.skeletalMuscleKg,
        visceralLevel: initial.visceralLevel,
        doctorNote: initial.doctorNote,
        status: initial.status,
        photoUploaded: initial.photoUploaded,
        inbodyUploaded: initial.inbodyUploaded,
      });
      return;
    }
    setForm({
      ...(seedMetrics ?? emptyMetrics),
      doctorNote: '',
      status: '진행중',
      photoUploaded: false,
      inbodyUploaded: false,
    });
    // seedMetrics는 모달 열릴 때만 반영
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, mode]);

  if (!open) return null;

  const set = <K extends keyof VisitFormData>(key: K, value: VisitFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="panel-card shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">{mode === 'add' ? '오늘 메모' : '메모 수정'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">체중·인바디 수치는 기록지 OCR로 자동 입력됩니다</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label="의사 메모">
            <textarea
              value={form.doctorNote}
              onChange={(e) => set('doctorNote', e.target.value)}
              rows={5}
              className="input-field resize-none"
              placeholder="오늘 상담·소견을 입력하세요"
              autoFocus
            />
          </Field>

          <Field label="입력상태">
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value as VisitStatus)}
              className="input-field"
            >
              <option value="진행중">진행중</option>
              <option value="완료">완료</option>
              <option value="미완료">미완료</option>
            </select>
          </Field>

          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.photoUploaded}
                onChange={(e) => set('photoUploaded', e.target.checked)}
              />
              사진 완료
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.inbodyUploaded}
                onChange={(e) => set('inbodyUploaded', e.target.checked)}
              />
              인바디 완료
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-blue-700"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
