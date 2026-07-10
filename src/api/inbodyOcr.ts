import { parseInbodyText } from '../lib/inbodyParser';
import type { InbodyParsedData } from '../lib/inbodyOcrTypes';

export type OcrProgressHandler = (percent: number, message: string) => void;

/** 인바디 기록지 이미지에서 OCR 실행 (브라우저 내 처리) */
export async function runInbodyOcr(
  file: File,
  onProgress?: OcrProgressHandler,
): Promise<InbodyParsedData> {
  onProgress?.(0, 'OCR 엔진 로딩 중…');

  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('kor+eng', 1, {
    logger: (m) => {
      if (m.status === 'loading language traineddata') {
        onProgress?.(10, '한국어 데이터 로딩 중…');
      }
      if (m.status === 'recognizing text') {
        onProgress?.(20 + Math.round((m.progress ?? 0) * 70), '기록지 텍스트 인식 중…');
      }
    },
  });

  try {
    const { data } = await worker.recognize(file);
    onProgress?.(95, '항목 추출 중…');
    const parsed = parseInbodyText(data.text);
    onProgress?.(100, '분석 완료');
    return parsed;
  } finally {
    await worker.terminate();
  }
}

export { parseInbodyText, formatParsedSummary } from '../lib/inbodyParser';
export { evaluatePatientMatch, normalizePatientName } from '../lib/patientMatcher';
export type { InbodyParsedData, PatientMatchResult, InbodyOcrApplyResult } from '../lib/inbodyOcrTypes';
