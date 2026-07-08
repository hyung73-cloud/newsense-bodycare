import { useEffect, useState } from 'react';
import { Upload, X, FileImage } from 'lucide-react';
import FileUploadButton from './FileUploadButton';

interface InbodyUploadModalProps {
  open: boolean;
  patientName: string;
  onClose: () => void;
  onUploadFile: (file: File) => void;
}

export default function InbodyUploadModal({ open, patientName, onClose, onUploadFile }: InbodyUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreviewUrl(null);
    }
  }, [open]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="panel-card shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">인바디 기록지 업로드</h3>
              <p className="text-xs text-gray-500 mt-0.5">{patientName} · 오늘 방문 기록</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {previewUrl ? (
          <div className="mb-4">
            <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img src={previewUrl} alt="인바디 결과지 미리보기" className="w-full max-h-72 object-contain" />
            </div>
            <p className="text-xs text-gray-400 mt-2 truncate">{file?.name}</p>
          </div>
        ) : (
          <div className="mb-4 border-2 border-dashed border-gray-200 rounded-lg py-10 flex flex-col items-center justify-center text-center">
            <FileImage className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">인바디 결과지 이미지를 선택하세요.</p>
            <p className="text-[11px] text-gray-400 mt-1">JPG · PNG 등 이미지 파일</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <FileUploadButton onFile={setFile} className="btn-outline text-sm">
            <FileImage className="w-4 h-4" />
            {file ? '다시 선택' : '파일 선택'}
          </FileUploadButton>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              취소
            </button>
            <button
              type="button"
              disabled={!file}
              onClick={() => file && onUploadFile(file)}
              className="btn-primary text-sm py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              업로드
            </button>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 mt-3">※ 임시 업로드입니다. 새로고침 시 초기화됩니다.</p>
      </div>
    </div>
  );
}
