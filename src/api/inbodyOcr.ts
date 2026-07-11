import { parseInbodyText } from '../lib/inbodyParser';
import { parseBodyShapeText } from '../lib/bodyShapeParser';
import type { InbodyParsedData } from '../lib/inbodyOcrTypes';
import type { BodyShapeParsedData } from '../lib/bodyShapeParser';

export type OcrProgressHandler = (percent: number, message: string) => void;

async function runOcrRaw(
  file: File,
  onProgress?: OcrProgressHandler,
  label = '기록지',
): Promise<string> {
  onProgress?.(0, 'OCR 엔진 로딩 중…');

  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('kor+eng', 1, {
    logger: (m) => {
      if (m.status === 'loading language traineddata') {
        onProgress?.(10, '한국어 데이터 로딩 중…');
      }
      if (m.status === 'recognizing text') {
        onProgress?.(20 + Math.round((m.progress ?? 0) * 70), `${label} 텍스트 인식 중…`);
      }
    },
  });

  try {
    const { data } = await worker.recognize(file);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

/** 인바디 기록지 이미지에서 OCR 실행 (브라우저 내 처리) */
export async function runInbodyOcr(
  file: File,
  onProgress?: OcrProgressHandler,
): Promise<InbodyParsedData> {
  const text = await runOcrRaw(file, onProgress, '인바디');
  onProgress?.(95, '항목 추출 중…');
  const parsed = parseInbodyText(text);
  onProgress?.(100, '분석 완료');
  return parsed;
}

/** 체형결과지 — 복부 바깥둘레·안쪽둘레·지방두께 OCR */
export async function runBodyShapeOcr(
  file: File,
  onProgress?: OcrProgressHandler,
): Promise<BodyShapeParsedData> {
  const text = await runOcrRaw(file, onProgress, '체형결과지');
  onProgress?.(95, '복부 측정값 추출 중…');
  const parsed = parseBodyShapeText(text);
  onProgress?.(100, '분석 완료');
  return parsed;
}

export { parseInbodyText, formatParsedSummary } from '../lib/inbodyParser';
export { parseBodyShapeText, formatBodyShapeSummary } from '../lib/bodyShapeParser';
export { evaluatePatientMatch, normalizePatientName } from '../lib/patientMatcher';
export type { InbodyParsedData, PatientMatchResult, InbodyOcrApplyResult } from '../lib/inbodyOcrTypes';
export type { BodyShapeParsedData } from '../lib/bodyShapeParser';
