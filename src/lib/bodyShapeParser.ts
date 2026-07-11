/** 체형결과지 OCR — 복부 측정 1줄 텍스트 파싱 */

export interface BodyShapeParsedData {
  outerCircumferenceCm?: number;
  innerCircumferenceCm?: number;
  fatThicknessMm?: number;
  noteText: string;
  rawText: string;
  fieldCount: number;
}

function normalizeText(text: string): string {
  return text
    .replace(/\r/g, '\n')
    .replace(/[|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

/**
 * 예: "복부 바깥둘레 92.5 안쪽둘레 78.0 지방두께 28"
 * 또는 "바깥둘레:92.5cm 안쪽둘레:78cm 지방두께:28mm"
 */
export function parseBodyShapeText(rawText: string): BodyShapeParsedData {
  const text = normalizeText(rawText);

  const outerCircumferenceCm = pickNumber(text, [
    /바깥\s*둘레\s*[:：]?\s*(\d{2,3}(?:\.\d+)?)\s*(?:cm|CM)?/i,
    /외측\s*둘레\s*[:：]?\s*(\d{2,3}(?:\.\d+)?)/i,
    /outer\s*(?:circ(?:umference)?)?\s*[:：]?\s*(\d{2,3}(?:\.\d+)?)/i,
  ]);

  const innerCircumferenceCm = pickNumber(text, [
    /안쪽\s*둘레\s*[:：]?\s*(\d{2,3}(?:\.\d+)?)\s*(?:cm|CM)?/i,
    /내측\s*둘레\s*[:：]?\s*(\d{2,3}(?:\.\d+)?)/i,
    /안의\s*둘레\s*[:：]?\s*(\d{2,3}(?:\.\d+)?)/i,
    /inner\s*(?:circ(?:umference)?)?\s*[:：]?\s*(\d{2,3}(?:\.\d+)?)/i,
  ]);

  const fatThicknessMm = pickNumber(text, [
    /지방\s*두께\s*[:：]?\s*(\d{1,3}(?:\.\d+)?)\s*(?:mm|MM|cm|CM)?/i,
    /fat\s*thickness\s*[:：]?\s*(\d{1,3}(?:\.\d+)?)/i,
  ]);

  const fields = [outerCircumferenceCm, innerCircumferenceCm, fatThicknessMm];
  const noteParts: string[] = [];
  if (outerCircumferenceCm != null) noteParts.push(`바깥둘레 ${outerCircumferenceCm}`);
  if (innerCircumferenceCm != null) noteParts.push(`안쪽둘레 ${innerCircumferenceCm}`);
  if (fatThicknessMm != null) noteParts.push(`지방두께 ${fatThicknessMm}`);

  return {
    outerCircumferenceCm,
    innerCircumferenceCm,
    fatThicknessMm,
    noteText: noteParts.length ? `복부 ${noteParts.join(' ')}` : '',
    rawText,
    fieldCount: fields.filter((v) => v !== undefined).length,
  };
}

export function formatBodyShapeSummary(parsed: BodyShapeParsedData): string[] {
  const lines: string[] = [];
  if (parsed.outerCircumferenceCm != null) lines.push(`바깥둘레: ${parsed.outerCircumferenceCm} cm`);
  if (parsed.innerCircumferenceCm != null) lines.push(`안쪽둘레: ${parsed.innerCircumferenceCm} cm`);
  if (parsed.fatThicknessMm != null) lines.push(`지방두께: ${parsed.fatThicknessMm} mm`);
  return lines;
}
