import { useEffect, useState } from 'react';
import {
  Upload,
  X,
  FileImage,
  Loader2,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import FileUploadButton from './FileUploadButton';
import {
  runInbodyOcr,
  runBodyShapeOcr,
  formatParsedSummary,
  formatBodyShapeSummary,
  evaluatePatientMatch,
  type InbodyParsedData,
  type BodyShapeParsedData,
  type PatientMatchResult,
} from '../api/inbodyOcr';

export interface SheetUploadState {
  file: File | null;
  previewUrl: string | null;
  analyzing: boolean;
  progress: number;
  message: string;
}

export interface InbodyUploadPayload {
  inbodyFile: File | null;
  inbodyParsed: InbodyParsedData | null;
  match: PatientMatchResult | null;
  applyInbodyOcr: boolean;
  bodyShapeFile: File | null;
  bodyShapeParsed: BodyShapeParsedData | null;
  applyBodyShapeOcr: boolean;
}

interface InbodyUploadModalProps {
  open: boolean;
  patientName: string;
  chartNo: string;
  ocrEnabled: boolean;
  onClose: () => void;
  onUpload: (payload: InbodyUploadPayload) => Promise<void>;
}

const emptySheet = (): SheetUploadState => ({
  file: null,
  previewUrl: null,
  analyzing: false,
  progress: 0,
  message: '',
});

export default function InbodyUploadModal({
  open,
  patientName,
  chartNo,
  ocrEnabled,
  onClose,
  onUpload,
}: InbodyUploadModalProps) {
  const [inbody, setInbody] = useState<SheetUploadState>(emptySheet);
  const [bodyShape, setBodyShape] = useState<SheetUploadState>(emptySheet);
  const [inbodyParsed, setInbodyParsed] = useState<InbodyParsedData | null>(null);
  const [bodyShapeParsed, setBodyShapeParsed] = useState<BodyShapeParsedData | null>(null);
  const [match, setMatch] = useState<PatientMatchResult | null>(null);
  const [forceApply, setForceApply] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setInbody(emptySheet());
      setBodyShape(emptySheet());
      setInbodyParsed(null);
      setBodyShapeParsed(null);
      setMatch(null);
      setForceApply(false);
      setUploading(false);
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (!inbody.file) {
      setInbody((s) => ({ ...s, previewUrl: null }));
      return;
    }
    const url = URL.createObjectURL(inbody.file);
    setInbody((s) => ({ ...s, previewUrl: url }));
    return () => URL.revokeObjectURL(url);
  }, [inbody.file]);

  useEffect(() => {
    if (!bodyShape.file) {
      setBodyShape((s) => ({ ...s, previewUrl: null }));
      return;
    }
    const url = URL.createObjectURL(bodyShape.file);
    setBodyShape((s) => ({ ...s, previewUrl: url }));
    return () => URL.revokeObjectURL(url);
  }, [bodyShape.file]);

  const handleInbodyFile = async (file: File) => {
    setInbody({ file, previewUrl: null, analyzing: false, progress: 0, message: '' });
    setInbodyParsed(null);
    setMatch(null);
    setForceApply(false);
    setError('');
    if (!ocrEnabled) return;

    setInbody((s) => ({ ...s, analyzing: true, message: '인바디 분석 중…' }));
    try {
      const result = await runInbodyOcr(file, (pct, msg) => {
        setInbody((s) => ({ ...s, progress: pct, message: msg }));
      });
      setInbodyParsed(result);
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
    } catch (err) {
      console.warn('[inbody-ocr]', err);
      setError('인바디 자동 분석에 실패했습니다. 이미지만 저장합니다.');
    } finally {
      setInbody((s) => ({ ...s, analyzing: false, progress: 100 }));
    }
  };

  const handleBodyShapeFile = async (file: File) => {
    setBodyShape({ file, previewUrl: null, analyzing: false, progress: 0, message: '' });
    setBodyShapeParsed(null);
    setError('');
    if (!ocrEnabled) return;

    setBodyShape((s) => ({ ...s, analyzing: true, message: '체형결과지 분석 중…' }));
    try {
      const result = await runBodyShapeOcr(file, (pct, msg) => {
        setBodyShape((s) => ({ ...s, progress: pct, message: msg }));
      });
      setBodyShapeParsed(result);
    } catch (err) {
      console.warn('[body-shape-ocr]', err);
      setError((prev) => prev || '체형결과지 자동 분석에 실패했습니다. 이미지만 저장합니다.');
    } finally {
      setBodyShape((s) => ({ ...s, analyzing: false, progress: 100 }));
    }
  };

  const applyInbodyOcr = Boolean(
    ocrEnabled && inbodyParsed && (match?.matched || forceApply) && inbodyParsed.fieldCount >= 2,
  );
  const applyBodyShapeOcr = Boolean(
    ocrEnabled && bodyShapeParsed && bodyShapeParsed.fieldCount >= 1,
  );

  const canSave = Boolean(inbody.file || bodyShape.file);
  const busy = inbody.analyzing || bodyShape.analyzing || uploading;

  const handleUpload = async () => {
    if (!canSave) return;
    setUploading(true);
    setError('');
    try {
      await onUpload({
        inbodyFile: inbody.file,
        inbodyParsed: ocrEnabled ? inbodyParsed : null,
        match,
        applyInbodyOcr,
        bodyShapeFile: bodyShape.file,
        bodyShapeParsed: ocrEnabled ? bodyShapeParsed : null,
        applyBodyShapeOcr,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="panel-card shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              {ocrEnabled ? <ScanLine className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">기록지 업로드 (2장)</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {patientName} · 차트 {chartNo} · 인바디 + 체형결과지
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SheetSlot
            title="① 인바디 기록지"
            hint="체중·체지방·골격근 등"
            state={inbody}
            onFile={(f) => void handleInbodyFile(f)}
            disabled={busy && !inbody.analyzing}
          />
          <SheetSlot
            title="② 체형결과지"
            hint="복부 바깥둘레·안쪽둘레·지방두께"
            state={bodyShape}
            onFile={(f) => void handleBodyShapeFile(f)}
            disabled={busy && !bodyShape.analyzing}
          />
        </div>

        {ocrEnabled && inbodyParsed && !inbody.analyzing && (
          <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
              <ScanLine className="w-3.5 h-3.5 text-primary" />
              인바디 OCR 결과
            </div>
            {formatParsedSummary(inbodyParsed).length > 0 ? (
              <ul className="text-xs text-gray-600 space-y-0.5">
                {formatParsedSummary(inbodyParsed).map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">읽을 수 있는 항목이 적습니다.</p>
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
            {match && !match.matched && inbodyParsed.fieldCount >= 2 && (
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

        {ocrEnabled && bodyShapeParsed && !bodyShape.analyzing && (
          <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
              <ScanLine className="w-3.5 h-3.5 text-primary" />
              체형결과지 OCR (복부)
            </div>
            {formatBodyShapeSummary(bodyShapeParsed).length > 0 ? (
              <ul className="text-xs text-gray-600 space-y-0.5">
                {formatBodyShapeSummary(bodyShapeParsed).map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">
                「복부 바깥둘레 ○○ 안쪽둘레 ○○ 지방두께 ○○」 형식으로 적어 주세요.
              </p>
            )}
          </div>
        )}

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!canSave || busy}
            onClick={() => void handleUpload()}
            className="btn-primary text-sm py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                저장 중
              </>
            ) : applyInbodyOcr || applyBodyShapeOcr ? (
              '자동입력 후 저장'
            ) : (
              '저장'
            )}
          </button>
        </div>

        <p className="text-[11px] text-gray-400 mt-3">
          ※ 두 장 모두 올리거나 한 장만 올려도 됩니다. 체형결과지는 방문마다 복부 그래프로 쌓입니다.
        </p>
      </div>
    </div>
  );
}

function SheetSlot({
  title,
  hint,
  state,
  onFile,
  disabled,
}: {
  title: string;
  hint: string;
  state: SheetUploadState;
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-3 space-y-2">
      <div>
        <div className="text-sm font-bold text-gray-900">{title}</div>
        <div className="text-[11px] text-gray-400">{hint}</div>
      </div>

      {state.analyzing && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-4 text-center">
          <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto mb-1.5" />
          <p className="text-xs font-medium text-gray-800">{state.message || '분석 중…'}</p>
          <div className="mt-2 h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${state.progress}%` }} />
          </div>
        </div>
      )}

      {!state.analyzing && state.previewUrl && (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img src={state.previewUrl} alt={title} className="w-full max-h-40 object-contain" />
        </div>
      )}

      {!state.analyzing && !state.previewUrl && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg py-8 flex flex-col items-center text-center">
          <FileImage className="w-7 h-7 text-gray-300 mb-1.5" />
          <p className="text-xs text-gray-500">이미지를 선택하세요</p>
        </div>
      )}

      <FileUploadButton onFile={onFile} className={`btn-outline text-xs w-full justify-center ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <FileImage className="w-3.5 h-3.5" />
        {state.file ? '다시 선택' : '파일 선택'}
      </FileUploadButton>
      {state.file && <p className="text-[10px] text-gray-400 truncate">{state.file.name}</p>}
    </div>
  );
}
