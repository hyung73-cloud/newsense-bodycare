import { useEffect, useState } from 'react';
import { Upload, X, FileImage, Loader2, ScanLine, CheckCircle2, AlertTriangle } from 'lucide-react';
import FileUploadButton from './FileUploadButton';
import {
  runInbodyOcr,
  formatParsedSummary,
  evaluatePatientMatch,
  type InbodyParsedData,
  type PatientMatchResult,
} from '../api/inbodyOcr';

export interface InbodyUploadPayload {
  file: File;
  parsed: InbodyParsedData | null;
  match: PatientMatchResult | null;
  applyOcr: boolean;
}

interface InbodyUploadModalProps {
  open: boolean;
  patientName: string;
  chartNo: string;
  ocrEnabled: boolean;
  onClose: () => void;
  onUpload: (payload: InbodyUploadPayload) => Promise<void>;
}

type Step = 'select' | 'analyzing' | 'preview' | 'uploading';

export default function InbodyUploadModal({
  open,
  patientName,
  chartNo,
  ocrEnabled,
  onClose,
  onUpload,
}: InbodyUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('select');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrMessage, setOcrMessage] = useState('');
  const [parsed, setParsed] = useState<InbodyParsedData | null>(null);
  const [match, setMatch] = useState<PatientMatchResult | null>(null);
  const [forceApply, setForceApply] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreviewUrl(null);
      setStep('select');
      setOcrProgress(0);
      setOcrMessage('');
      setParsed(null);
      setMatch(null);
      setForceApply(false);
      setError('');
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

  const handleFile = async (next: File) => {
    setFile(next);
    setParsed(null);
    setMatch(null);
    setForceApply(false);
    setError('');

    if (!ocrEnabled) return;

    setStep('analyzing');
    try {
      const result = await runInbodyOcr(next, (pct, msg) => {
        setOcrProgress(pct);
        setOcrMessage(msg);
      });
      setParsed(result);
      setMatch(
        evaluatePatientMatch(result, {
          id: '',
          chartNo,
          name: patientName,
          sex: '여',
          birth: '',
          ageAtToday: 0,
          heightCm: 0,
          startDate: '',
          totalVisits: 0,
          lastVisitDate: '',
        }),
      );
      setStep('preview');
    } catch (err) {
      console.warn('[inbody-ocr]', err);
      setError('기록지 자동 분석에 실패했습니다. 이미지만 저장합니다.');
      setStep('select');
    }
  };

  const canAutoApply = Boolean(
    ocrEnabled && parsed && (match?.matched || forceApply) && parsed.fieldCount >= 2,
  );

  const handleUpload = async () => {
    if (!file) return;
    setStep('uploading');
    setError('');
    try {
      await onUpload({
        file,
        parsed: ocrEnabled ? parsed : null,
        match,
        applyOcr: canAutoApply,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다.');
      setStep(parsed ? 'preview' : 'select');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="panel-card shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              {ocrEnabled ? <ScanLine className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">인바디 기록지 업로드</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {patientName} · 차트 {chartNo}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!ocrEnabled && (
          <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            이 환자는 수동 등록 환자입니다. 기록지 이미지만 저장하고 OCR 자동입력은 건너뜁니다.
          </div>
        )}

        {step === 'analyzing' && (
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-5 text-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800">{ocrMessage || '기록지 분석 중…'}</p>
            <div className="mt-3 h-1.5 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${ocrProgress}%` }} />
            </div>
          </div>
        )}

        {previewUrl && step !== 'analyzing' && (
          <div className="mb-4">
            <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img src={previewUrl} alt="인바디 결과지 미리보기" className="w-full max-h-56 object-contain" />
            </div>
            <p className="text-xs text-gray-400 mt-2 truncate">{file?.name}</p>
          </div>
        )}

        {!previewUrl && step !== 'analyzing' && (
          <div className="mb-4 border-2 border-dashed border-gray-200 rounded-lg py-10 flex flex-col items-center justify-center text-center">
            <FileImage className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">인바디 결과지 이미지를 선택하세요.</p>
            <p className="text-[11px] text-gray-400 mt-1">JPG · PNG · 선명한 사진 권장</p>
          </div>
        )}

        {ocrEnabled && parsed && step === 'preview' && (
          <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
              <ScanLine className="w-3.5 h-3.5 text-primary" />
              OCR 자동 인식 결과
            </div>
            {formatParsedSummary(parsed).length > 0 ? (
              <ul className="text-xs text-gray-600 space-y-0.5">
                {formatParsedSummary(parsed).map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">읽을 수 있는 항목이 적습니다. 이미지만 저장됩니다.</p>
            )}
            {match && (
              <div
                className={`flex items-start gap-2 text-xs rounded-md px-2.5 py-2 ${
                  match.matched ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                }`}
              >
                {match.matched ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-medium">{match.matched ? '환자 매칭 성공' : '환자 매칭 실패'}</div>
                  <div className="mt-0.5 opacity-90">{match.reason}</div>
                </div>
              </div>
            )}
            {match && !match.matched && parsed.fieldCount >= 2 && (
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceApply}
                  onChange={(e) => setForceApply(e.target.checked)}
                />
                이름이 달라도 이 환자에게 수치 자동입력 적용
              </label>
            )}
          </div>
        )}

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex items-center justify-between gap-3">
          <FileUploadButton onFile={(f) => void handleFile(f)} className="btn-outline text-sm">
            <FileImage className="w-4 h-4" />
            {file ? '다시 선택' : '파일 선택'}
          </FileUploadButton>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={step === 'uploading'}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              disabled={!file || step === 'analyzing' || step === 'uploading'}
              onClick={() => void handleUpload()}
              className="btn-primary text-sm py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 'uploading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                  저장 중
                </>
              ) : canAutoApply ? (
                '자동입력 후 저장'
              ) : (
                '저장'
              )}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 mt-3">
          {ocrEnabled
            ? '※ 매칭 성공 시 체중·체지방·골격근·키·나이 등이 자동 입력되고 서버에 영구 저장됩니다.'
            : '※ 기록지 이미지는 Supabase Storage에 영구 저장됩니다.'}
        </p>
      </div>
    </div>
  );
}
