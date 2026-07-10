import type { Patient } from '../types';
import type { InbodyParsedData, PatientMatchResult } from './inbodyOcrTypes';

export function normalizePatientName(name: string): string {
  return name.replace(/\s/g, '').replace(/님$/u, '').trim();
}

/** OCR 이름·차트번호로 등록 환자와 매칭 */
export function evaluatePatientMatch(parsed: InbodyParsedData, patient: Patient): PatientMatchResult {
  const patientName = patient.name;
  const ocrName = parsed.name?.trim();

  if (!ocrName) {
    return {
      matched: false,
      score: 0,
      reason: '기록지에서 이름을 읽지 못했습니다. 수동 확인이 필요합니다.',
      patientName,
    };
  }

  const a = normalizePatientName(ocrName);
  const b = normalizePatientName(patientName);

  if (a === b) {
    return { matched: true, score: 100, reason: '이름이 일치합니다.', ocrName, patientName };
  }
  if (a.includes(b) || b.includes(a)) {
    return { matched: true, score: 85, reason: '이름이 유사하게 일치합니다.', ocrName, patientName };
  }

  const chart = patient.chartNo.trim();
  if (chart && parsed.rawText.replace(/\s/g, '').includes(chart)) {
    return { matched: true, score: 90, reason: '기록지에 차트번호가 확인되었습니다.', ocrName, patientName };
  }

  return {
    matched: false,
    score: 0,
    reason: `이름 불일치 (기록지: ${ocrName}, 등록: ${patientName})`,
    ocrName,
    patientName,
  };
}
