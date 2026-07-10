import { useEffect, useState } from 'react';
import { X, UserPlus, UserRound } from 'lucide-react';
import type { NewPatientFormData, VisitFormData } from '../api/mock';
import {
  clearTodayInputDraft,
  createPatientWithTodayVisit,
  getAllPatients,
  loadTodayInputDraft,
  registerReturningPatientToday,
  saveTodayInputDraft,
  searchPatients,
} from '../api/mock';

type InputMode = 'new' | 'returning';

interface TodayInputModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (patientId: string) => void;
}

interface DraftShape {
  mode: InputMode;
  patient: NewPatientFormData;
  visit: VisitFormData;
  selectedPatientId: string;
  searchQuery: string;
}

const defaultPatient: NewPatientFormData = {
  name: '',
  chartNo: '',
};

const defaultVisit: VisitFormData = {
  weightKg: 0,
  waistCm: 0,
  bodyFatPct: 0,
  skeletalMuscleKg: 0,
  visceralLevel: 0,
  doctorNote: '',
  status: '미완료',
  photoUploaded: false,
  inbodyUploaded: false,
};

export default function TodayInputModal({ open, onClose, onSuccess }: TodayInputModalProps) {
  const [mode, setMode] = useState<InputMode>('new');
  const [patientForm, setPatientForm] = useState<NewPatientFormData>(defaultPatient);
  const [visitForm, setVisitForm] = useState<VisitFormData>(defaultVisit);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const draft = loadTodayInputDraft<DraftShape>();
    if (draft) {
      setMode(draft.mode);
      setPatientForm(draft.patient);
      setVisitForm(draft.visit);
      setSearchQuery(draft.searchQuery);
      setSelectedPatientId(draft.selectedPatientId);
    } else {
      setMode('new');
      setPatientForm(defaultPatient);
      setVisitForm(defaultVisit);
      setSearchQuery('');
      setSelectedPatientId('');
    }
    setError('');
  }, [open]);

  if (!open) return null;

  const allPatients = getAllPatients();
  const results = searchQuery.trim() ? searchPatients(searchQuery) : allPatients.slice(0, 8);
  const selectedPatient = allPatients.find((p) => p.id === selectedPatientId);

  const setVisit = <K extends keyof VisitFormData>(key: K, value: VisitFormData[K]) => {
    setVisitForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDraft = () => {
    saveTodayInputDraft({ mode, patient: patientForm, visit: visitForm, selectedPatientId, searchQuery });
    setError('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'new') {
      if (!patientForm.name.trim()) {
        setError('환자 이름을 입력해주세요.');
        return;
      }
      if (!patientForm.chartNo.trim()) {
        setError('고유차트번호를 입력해주세요.');
        return;
      }
      if (allPatients.some((p) => p.chartNo === patientForm.chartNo.trim())) {
        setError('이미 사용 중인 차트번호입니다.');
        return;
      }
      const { patient } = createPatientWithTodayVisit(patientForm, visitForm);
      clearTodayInputDraft();
      onSuccess(patient.id);
      onClose();
      return;
    }

    if (!selectedPatientId) {
      setError('재진 환자를 선택해주세요.');
      return;
    }
    registerReturningPatientToday(selectedPatientId, visitForm);
    clearTodayInputDraft();
    onSuccess(selectedPatientId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="panel-card shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">오늘 입력하기</h3>
            <p className="text-xs text-gray-500 mt-0.5">신규 등록 또는 재진 환자 오늘 기록 입력</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <ModeButton active={mode === 'new'} onClick={() => setMode('new')} icon={<UserPlus className="w-4 h-4" />} label="신규 환자" />
            <ModeButton active={mode === 'returning'} onClick={() => setMode('returning')} icon={<UserRound className="w-4 h-4" />} label="재진 환자" />
          </div>

          {mode === 'new' ? (
            <div className="grid grid-cols-2 gap-4">
              <Field label="이름">
                <input value={patientForm.name} onChange={(e) => setPatientForm((p) => ({ ...p, name: e.target.value }))} className="input-field" required />
              </Field>
              <Field label="고유차트번호">
                <input value={patientForm.chartNo} onChange={(e) => setPatientForm((p) => ({ ...p, chartNo: e.target.value }))} className="input-field" placeholder="예: 000123" required />
              </Field>
            </div>
          ) : (
            <div className="space-y-3">
              <Field label="환자 검색">
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field" placeholder="이름, 차트번호, 전화 끝자리" />
              </Field>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 ${selectedPatientId === p.id ? 'bg-blue-50 text-primary font-medium' : ''}`}
                  >
                    {p.name} <span className="text-gray-400 text-xs ml-2">{p.chartNo}</span>
                  </button>
                ))}
                {results.length === 0 && <p className="px-3 py-4 text-xs text-gray-400 text-center">검색 결과가 없습니다.</p>}
              </div>
              {selectedPatient && (
                <p className="text-xs text-gray-500">
                  선택: <strong className="text-gray-800">{selectedPatient.name}</strong> ({selectedPatient.chartNo})
                </p>
              )}
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 flex gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={visitForm.photoUploaded} onChange={(e) => setVisit('photoUploaded', e.target.checked)} />
              사진 완료
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={visitForm.inbodyUploaded} onChange={(e) => setVisit('inbodyUploaded', e.target.checked)} />
              인바디 완료
            </label>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex justify-between gap-3 pt-2">
            <button type="button" onClick={handleDraft} className="btn-outline text-sm py-2">임시 저장</button>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
              <button type="submit" className="btn-primary text-sm py-2">등록 완료</button>
            </div>
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

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
        active ? 'border-primary bg-blue-50 text-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
