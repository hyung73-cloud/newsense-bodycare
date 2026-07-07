import { Upload } from 'lucide-react';

interface InbodyUploadModalProps {
  open: boolean;
  patientName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function InbodyUploadModal({ open, patientName, onClose, onConfirm }: InbodyUploadModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="panel-card shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">인바디 기록지 업로드</h3>
            <p className="text-xs text-gray-500 mt-0.5">{patientName} · 오늘 방문 기록</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          실제 파일 업로드는 연결되지 않았습니다. 확인 시 오늘 방문 기록의 인바디 상태가 <strong>업로드 완료</strong>로 변경됩니다.
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            취소
          </button>
          <button type="button" onClick={onConfirm} className="btn-primary text-sm py-2">
            업로드 완료 처리
          </button>
        </div>
      </div>
    </div>
  );
}
