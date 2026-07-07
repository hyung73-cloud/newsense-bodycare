import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Visit, VisitStatus } from '../types';
import type { VisitFormData } from '../api/mock';

interface VisitFormModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  initial?: Visit;
  onClose: () => void;
  onSave: (data: VisitFormData) => void;
}

const defaultForm: VisitFormData = {
  weightKg: 70,
  waistCm: 84,
  bodyFatPct: 40,
  skeletalMuscleKg: 20,
  visceralLevel: 12,
  doctorNote: '',
  status: '완료',
  photoUploaded: true,
  inbodyUploaded: true,
};

export default function VisitFormModal({ open, mode, initial, onClose, onSave }: VisitFormModalProps) {
  const [form, setForm] = useState<VisitFormData>(defaultForm);

  useEffect(() => {
    if (open && initial && mode === 'edit') {
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
    } else if (open && mode === 'add') {
      setForm({ ...defaultForm, doctorNote: '오늘 방문 기록 추가' });
    }
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
        className="bg-white rounded-card shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">
            {mode === 'add' ? '오늘 기록 추가' : '기록 수정'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="체중 (kg)">
              <input
                type="number"
                step="0.1"
                value={form.weightKg}
                onChange={(e) => set('weightKg', Number(e.target.value))}
                className="input-field"
                required
              />
            </Field>
            <Field label="허리둘레 (cm)">
              <input
                type="number"
                step="0.1"
                value={form.waistCm}
                onChange={(e) => set('waistCm', Number(e.target.value))}
                className="input-field"
                required
              />
            </Field>
            <Field label="체지방률 (%)">
              <input
                type="number"
                step="0.1"
                value={form.bodyFatPct}
                onChange={(e) => set('bodyFatPct', Number(e.target.value))}
                className="input-field"
                required
              />
            </Field>
            <Field label="골격근량 (kg)">
              <input
                type="number"
                step="0.1"
                value={form.skeletalMuscleKg}
                onChange={(e) => set('skeletalMuscleKg', Number(e.target.value))}
                className="input-field"
                required
              />
            </Field>
            <Field label="내장지방레벨">
              <input
                type="number"
                value={form.visceralLevel}
                onChange={(e) => set('visceralLevel', Number(e.target.value))}
                className="input-field"
                required
              />
            </Field>
            <Field label="입력상태">
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value as VisitStatus)}
                className="input-field"
              >
                <option value="완료">완료</option>
                <option value="진행중">진행중</option>
                <option value="미완료">미완료</option>
              </select>
            </Field>
          </div>

          <Field label="의사 메모">
            <textarea
              value={form.doctorNote}
              onChange={(e) => set('doctorNote', e.target.value)}
              rows={3}
              className="input-field resize-none"
            />
          </Field>

          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.photoUploaded}
                onChange={(e) => set('photoUploaded', e.target.checked)}
              />
              사진 업로드 완료
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.inbodyUploaded}
                onChange={(e) => set('inbodyUploaded', e.target.checked)}
              />
              인바디 업로드 완료
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
