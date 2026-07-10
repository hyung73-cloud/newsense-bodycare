import type { Sex } from '../types';

/** 인바디 기록지 OCR 파싱 결과 */
export interface InbodyParsedData {
  name?: string;
  sex?: Sex;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  bodyFatPct?: number;
  skeletalMuscleKg?: number;
  visceralLevel?: number;
  waistCm?: number;
  bmrKcal?: number;
  abdominalFatRatio?: number;
  smi?: number;
  rawText: string;
  /** 추출된 항목 수 (품질 지표) */
  fieldCount: number;
}

export interface PatientMatchResult {
  matched: boolean;
  score: number;
  reason: string;
  ocrName?: string;
  patientName: string;
}

export interface InbodyOcrApplyResult {
  applied: boolean;
  parsed: InbodyParsedData | null;
  match: PatientMatchResult | null;
  skippedReason?: string;
}
