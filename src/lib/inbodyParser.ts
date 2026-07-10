import type { InbodyParsedData } from './inbodyOcrTypes';
import type { Sex } from '../types';

function normalizeText(text: string): string {
  return text.replace(/\r/g, '\n').replace(/[|]/g, ' ').replace(/\s+/g, ' ');
}

function pickNumber(text: string, patterns: RegExp[]): number | undefined {
  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    const n = parseFloat(m[1].replace(/,/g, ''));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function pickString(text: string, patterns: RegExp[]): string | undefined {
  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    const value = m[1].replace(/\s+/g, '').trim();
    if (value) return value;
  }
  return undefined;
}

function pickSex(text: string): Sex | undefined {
  if (/(?:성별|Gender)\s*[:：]?\s*남/i.test(text) || /\bMale\b/i.test(text)) return '남';
  if (/(?:성별|Gender)\s*[:：]?\s*여/i.test(text) || /\bFemale\b/i.test(text)) return '여';
  return undefined;
}

/** OCR 텍스트에서 인바디 항목 추출 */
export function parseInbodyText(rawText: string): InbodyParsedData {
  const text = normalizeText(rawText);
  const compact = text.replace(/\s+/g, ' ');

  const name = pickString(compact, [
    /(?:이\s*름|Name)\s*[:：]?\s*([가-힣A-Za-z]{2,10})/i,
    /([가-힣]{2,4})\s*(?:님)?\s*(?:성별|나이|신장)/,
  ]);

  const age = pickNumber(compact, [
    /(?:나\s*이|Age)\s*[:：]?\s*(\d{1,3})\s*(?:세|years?)?/i,
    /(?:나이)\s*(\d{1,2})\s/,
  ]);

  const heightCm = pickNumber(compact, [
    /(?:신\s*장|Height)\s*[:：]?\s*(\d{2,3}(?:\.\d+)?)\s*(?:cm|CM)?/i,
  ]);

  const weightKg = pickNumber(compact, [
    /(?:체\s*중|Weight)\s*[:：]?\s*(\d{2,3}(?:\.\d+)?)\s*(?:kg|KG)?/i,
  ]);

  const bodyFatPct = pickNumber(compact, [
    /(?:체지방률|체지방\s*%|PBF|Percent Body Fat)\s*[:：]?\s*(\d{1,2}(?:\.\d+)?)\s*%?/i,
  ]);

  const skeletalMuscleKg = pickNumber(compact, [
    /(?:골격근량|근육량|SMM|Skeletal Muscle Mass)\s*[:：]?\s*(\d{1,2}(?:\.\d+)?)\s*(?:kg|KG)?/i,
  ]);

  const visceralLevel = pickNumber(compact, [
    /(?:내장지방레벨|내장지방|VFL|Visceral Fat Level)\s*[:：]?\s*(\d{1,2})/i,
  ]);

  const waistCm = pickNumber(compact, [
    /(?:허리둘레|복부둘레|Waist Circumference)\s*[:：]?\s*(\d{2,3}(?:\.\d+)?)\s*(?:cm|CM)?/i,
  ]);

  const bmrKcal = pickNumber(compact, [
    /(?:기초대사량|BMR|Basal Metabolic Rate)\s*[:：]?\s*(\d{3,4})\s*(?:kcal|Kcal)?/i,
  ]);

  const abdominalFatRatio = pickNumber(compact, [
    /(?:복부지방률|Abdominal Fat Ratio|복부지방)\s*[:：]?\s*(\d(?:\.\d+)?)/i,
  ]);

  const smi = pickNumber(compact, [
    /\bSMI\b\s*[:：]?\s*(\d(?:\.\d+)?)/i,
    /(?:SMI|골격근지수)\s*[:：]?\s*(\d(?:\.\d+)?)/i,
  ]);

  const sex = pickSex(compact);

  const fields: Array<number | string | undefined> = [
    name,
    sex,
    age,
    heightCm,
    weightKg,
    bodyFatPct,
    skeletalMuscleKg,
    visceralLevel,
    waistCm,
    bmrKcal,
    abdominalFatRatio,
    smi,
  ];

  return {
    name,
    sex,
    age,
    heightCm,
    weightKg,
    bodyFatPct,
    skeletalMuscleKg,
    visceralLevel,
    waistCm,
    bmrKcal,
    abdominalFatRatio,
    smi,
    rawText,
    fieldCount: fields.filter((v) => v !== undefined && v !== '').length,
  };
}

/** UI 미리보기용 라벨 */
export function formatParsedSummary(parsed: InbodyParsedData): string[] {
  const lines: string[] = [];
  if (parsed.name) lines.push(`이름: ${parsed.name}`);
  if (parsed.sex) lines.push(`성별: ${parsed.sex}`);
  if (parsed.age != null) lines.push(`나이: ${parsed.age}세`);
  if (parsed.heightCm != null) lines.push(`신장: ${parsed.heightCm} cm`);
  if (parsed.weightKg != null) lines.push(`체중: ${parsed.weightKg} kg`);
  if (parsed.bodyFatPct != null) lines.push(`체지방률: ${parsed.bodyFatPct}%`);
  if (parsed.skeletalMuscleKg != null) lines.push(`골격근량: ${parsed.skeletalMuscleKg} kg`);
  if (parsed.visceralLevel != null) lines.push(`내장지방: ${parsed.visceralLevel}`);
  if (parsed.waistCm != null) lines.push(`허리둘레: ${parsed.waistCm} cm`);
  if (parsed.bmrKcal != null) lines.push(`기초대사량: ${parsed.bmrKcal} kcal`);
  return lines;
}
