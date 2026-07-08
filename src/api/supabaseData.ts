import { supabase, STORAGE_BUCKET, isSupabaseEnabled } from '../lib/supabase';
import type { InbodyRecord, Patient, Visit, VisitImage } from '../types';

/* ──────────────────────────────────────────────
 * DB row 타입 (snake_case) ↔ 앱 타입 (camelCase) 매핑
 * ────────────────────────────────────────────── */

interface PatientRow {
  id: string;
  chart_no: string;
  name: string;
  sex: string;
  birth: string;
  age_at_today: number;
  height_cm: number;
  start_date: string | null;
  total_visits: number;
  last_visit_date: string | null;
  phone: string | null;
}

interface VisitRow {
  id: string;
  patient_id: string;
  date: string;
  weight_kg: number;
  waist_cm: number;
  body_fat_pct: number;
  skeletal_muscle_kg: number;
  visceral_level: number;
  doctor_note: string | null;
  photo_uploaded: boolean;
  inbody_uploaded: boolean;
  status: string;
  entered_by: string | null;
  entered_at: string | null;
  hidden: boolean;
  package_name: string | null;
}

interface VisitImageRow {
  id: string;
  visit_id: string;
  type: string;
  url: string | null;
  storage_path: string | null;
  weight_kg: number;
  waist_cm: number;
}

interface InbodyRow {
  visit_id: string;
  weight_kg: number;
  skeletal_muscle_kg: number;
  body_fat_pct: number;
  visceral_level: number;
  bmr_kcal: number;
  abdominal_fat_ratio: number;
  smi: number;
  sheet_image_url: string | null;
}

const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function rowToPatient(r: PatientRow): Patient {
  return {
    id: r.id,
    chartNo: r.chart_no,
    name: r.name,
    sex: r.sex as Patient['sex'],
    birth: r.birth,
    ageAtToday: num(r.age_at_today),
    heightCm: num(r.height_cm),
    startDate: r.start_date ?? '',
    totalVisits: num(r.total_visits),
    lastVisitDate: r.last_visit_date ?? '',
    phone: r.phone ?? undefined,
  };
}

function patientToRow(p: Patient): PatientRow {
  return {
    id: p.id,
    chart_no: p.chartNo,
    name: p.name,
    sex: p.sex,
    birth: p.birth,
    age_at_today: p.ageAtToday,
    height_cm: p.heightCm,
    start_date: p.startDate || null,
    total_visits: p.totalVisits,
    last_visit_date: p.lastVisitDate || null,
    phone: p.phone ?? null,
  };
}

function rowToVisit(r: VisitRow): Visit {
  return {
    id: r.id,
    patientId: r.patient_id,
    date: r.date,
    weightKg: num(r.weight_kg),
    waistCm: num(r.waist_cm),
    bodyFatPct: num(r.body_fat_pct),
    skeletalMuscleKg: num(r.skeletal_muscle_kg),
    visceralLevel: num(r.visceral_level),
    doctorNote: r.doctor_note ?? '',
    photoUploaded: !!r.photo_uploaded,
    inbodyUploaded: !!r.inbody_uploaded,
    status: r.status as Visit['status'],
    enteredBy: r.entered_by ?? '',
    enteredAt: r.entered_at ?? '',
    hidden: !!r.hidden,
    packageName: r.package_name ?? undefined,
  };
}

function visitToRow(v: Visit): VisitRow {
  return {
    id: v.id,
    patient_id: v.patientId,
    date: v.date,
    weight_kg: v.weightKg,
    waist_cm: v.waistCm,
    body_fat_pct: v.bodyFatPct,
    skeletal_muscle_kg: v.skeletalMuscleKg,
    visceral_level: v.visceralLevel,
    doctor_note: v.doctorNote,
    photo_uploaded: v.photoUploaded,
    inbody_uploaded: v.inbodyUploaded,
    status: v.status,
    entered_by: v.enteredBy,
    entered_at: v.enteredAt,
    hidden: v.hidden,
    package_name: v.packageName ?? null,
  };
}

function rowToImage(r: VisitImageRow): VisitImage {
  return {
    id: r.id,
    visitId: r.visit_id,
    type: r.type as VisitImage['type'],
    url: r.url ?? '',
    weightKg: num(r.weight_kg),
    waistCm: num(r.waist_cm),
  };
}

function imageToRow(img: VisitImage, storagePath?: string): VisitImageRow {
  return {
    id: img.id,
    visit_id: img.visitId,
    type: img.type,
    url: img.url,
    storage_path: storagePath ?? null,
    weight_kg: img.weightKg,
    waist_cm: img.waistCm,
  };
}

function rowToInbody(r: InbodyRow): InbodyRecord {
  return {
    visitId: r.visit_id,
    weightKg: num(r.weight_kg),
    skeletalMuscleKg: num(r.skeletal_muscle_kg),
    bodyFatPct: num(r.body_fat_pct),
    visceralLevel: num(r.visceral_level),
    bmrKcal: num(r.bmr_kcal),
    abdominalFatRatio: num(r.abdominal_fat_ratio),
    smi: num(r.smi),
    sheetImageUrl: r.sheet_image_url ?? '',
  };
}

function inbodyToRow(rec: InbodyRecord, storagePath?: string) {
  return {
    visit_id: rec.visitId,
    weight_kg: rec.weightKg,
    skeletal_muscle_kg: rec.skeletalMuscleKg,
    body_fat_pct: rec.bodyFatPct,
    visceral_level: rec.visceralLevel,
    bmr_kcal: rec.bmrKcal,
    abdominal_fat_ratio: rec.abdominalFatRatio,
    smi: rec.smi,
    sheet_image_url: rec.sheetImageUrl,
    ...(storagePath ? { sheet_storage_path: storagePath } : {}),
  };
}

/* ──────────────────────────────────────────────
 * 로드 / 시드
 * ────────────────────────────────────────────── */

export interface LoadedData {
  patients: Patient[];
  visits: Visit[];
  visitImages: VisitImage[];
  inbodyRecords: InbodyRecord[];
}

/**
 * 로드 결과를 3가지로 구분한다.
 * - loaded: 정상적으로 데이터를 읽음
 * - empty: 쿼리는 성공했으나 환자가 0명 (최초 실행 → 시드 대상)
 * - error: 쿼리 자체가 실패 (⚠️ 절대 시드/덮어쓰기 하면 안 됨)
 */
export type LoadResult =
  | { status: 'loaded'; data: LoadedData }
  | { status: 'empty' }
  | { status: 'error' };

/**
 * Supabase에서 전체 데이터를 읽는다.
 * 중요: 실패(error)와 빈 DB(empty)를 반드시 구분한다.
 *       실패를 빈 DB로 오인해 시드하면 실제 데이터를 덮어쓰는 사고가 난다.
 */
export async function loadAllFromSupabase(): Promise<LoadResult> {
  if (!isSupabaseEnabled || !supabase) return { status: 'error' };
  try {
    const [pRes, vRes, iRes, bRes] = await Promise.all([
      supabase.from('patients').select('*'),
      supabase.from('visits').select('*'),
      supabase.from('visit_images').select('*'),
      supabase.from('inbody_records').select('*'),
    ]);

    if (pRes.error) throw pRes.error;
    if (vRes.error) throw vRes.error;
    if (iRes.error) throw iRes.error;
    if (bRes.error) throw bRes.error;

    const patients = (pRes.data as PatientRow[]).map(rowToPatient);
    if (patients.length === 0) return { status: 'empty' };

    return {
      status: 'loaded',
      data: {
        patients,
        visits: (vRes.data as VisitRow[]).map(rowToVisit),
        visitImages: (iRes.data as VisitImageRow[]).map(rowToImage),
        inbodyRecords: (bRes.data as InbodyRow[]).map(rowToInbody),
      },
    };
  } catch (err) {
    console.error('[supabase] 데이터 로드 실패 — 시드/덮어쓰기를 하지 않습니다.', err);
    return { status: 'error' };
  }
}

/** 최초 실행 시 현재 in-memory 샘플 데이터를 DB에 채운다. */
export async function seedToSupabase(data: LoadedData): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  try {
    await supabase.from('patients').upsert(data.patients.map(patientToRow));
    await supabase.from('visits').upsert(data.visits.map(visitToRow));
    await supabase.from('visit_images').upsert(data.visitImages.map((i) => imageToRow(i)));
    await supabase.from('inbody_records').upsert(data.inbodyRecords.map((r) => inbodyToRow(r)));
    console.info('[supabase] 초기 샘플 데이터 시드 완료');
  } catch (err) {
    console.error('[supabase] 시드 실패', err);
  }
}

/* ──────────────────────────────────────────────
 * 개별 저장(쓰기) — 실패해도 UI를 막지 않도록 오류는 로깅만
 * ────────────────────────────────────────────── */

export async function persistPatient(p: Patient): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  const { error } = await supabase.from('patients').upsert(patientToRow(p));
  if (error) console.error('[supabase] 환자 저장 실패', error);
}

export async function persistVisit(v: Visit): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  const { error } = await supabase.from('visits').upsert(visitToRow(v));
  if (error) console.error('[supabase] 방문 저장 실패', error);
}

export async function persistVisitImage(img: VisitImage, storagePath?: string): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  const { error } = await supabase.from('visit_images').upsert(imageToRow(img, storagePath));
  if (error) console.error('[supabase] 이미지 저장 실패', error);
}

export async function persistInbody(rec: InbodyRecord, storagePath?: string): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  const { error } = await supabase.from('inbody_records').upsert(inbodyToRow(rec, storagePath));
  if (error) console.error('[supabase] 인바디 저장 실패', error);
}

/* ──────────────────────────────────────────────
 * 파일 업로드 (Storage)
 * ────────────────────────────────────────────── */

/** 파일을 스토리지에 업로드하고 { publicUrl, path } 반환. 실패 시 null. */
export async function uploadFile(
  path: string,
  file: File,
): Promise<{ publicUrl: string; path: string } | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: true, cacheControl: '3600' });
    if (error) throw error;
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return { publicUrl: data.publicUrl, path };
  } catch (err) {
    console.error('[supabase] 파일 업로드 실패', err);
    return null;
  }
}
