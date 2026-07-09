import { supabase, STORAGE_BUCKET, isSupabaseEnabled, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
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
let lastLoadErrorMessage: string | null = null;

/** 마지막 로드 실패 메시지 (오류 화면 안내용). */
export function getLastLoadErrorMessage(): string | null {
  return lastLoadErrorMessage;
}

function formatSupabaseError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof e.message === 'string') parts.push(e.message);
    if (typeof e.code === 'string') parts.push(`(${e.code})`);
    if (typeof e.details === 'string' && e.details) parts.push(e.details);
    if (parts.length) return parts.join(' ');
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} 시간 초과 (${ms / 1000}초)`)), ms),
    ),
  ]);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type CriticalData = { patients: Patient[]; visits: Visit[] };
type SecondaryData = { visitImages: VisitImage[]; inbodyRecords: InbodyRecord[] };

/** REST 호출용 헤더. 로그인 세션이 있으면 JWT를 사용 (RLS authenticated 정책 대응). */
async function getRestAuthHeaders(): Promise<Record<string, string>> {
  let bearer = supabaseAnonKey as string;
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) bearer = data.session.access_token;
  }
  return {
    apikey: supabaseAnonKey as string,
    Authorization: `Bearer ${bearer}`,
    Accept: 'application/json',
  };
}

/** REST API 직접 호출 (supabase-js 클라이언트보다 브라우저에서 안정적). */
async function restGet<T>(table: string): Promise<T[]> {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
    headers: await getRestAuthHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${table} HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T[]>;
}

/** 1단계: 환자·방문 로드 (8초 이내, REST 직접 호출). */
export async function loadCriticalFromSupabase(timeoutMs = 8000): Promise<
  | { status: 'loaded'; data: CriticalData }
  | { status: 'empty' }
  | { status: 'error' }
> {
  if (!isSupabaseEnabled || !supabaseUrl || !supabaseAnonKey) {
    lastLoadErrorMessage = 'Supabase 환경변수가 설정되지 않았습니다.';
    return { status: 'error' };
  }

  try {
    const result = await withTimeout(
      (async () => {
        const [pRows, vRows] = await Promise.all([
          restGet<PatientRow>('patients'),
          restGet<VisitRow>('visits'),
        ]);
        const patients = pRows.map(rowToPatient);
        if (patients.length === 0) return { status: 'empty' as const };
        return {
          status: 'loaded' as const,
          data: {
            patients,
            visits: vRows.map(rowToVisit),
          },
        };
      })(),
      timeoutMs,
      '데이터 로드',
    );
    lastLoadErrorMessage = null;
    return result;
  } catch (err) {
    lastLoadErrorMessage = formatSupabaseError(err);
    console.error('[supabase] 핵심 데이터 로드 실패', err);
    return { status: 'error' };
  }
}

/** 2단계: 사진·인바디는 백그라운드 로드 (실패해도 앱은 계속 사용). */
export async function loadSecondaryFromSupabase(timeoutMs = 8000): Promise<SecondaryData | null> {
  if (!isSupabaseEnabled || !supabaseUrl || !supabaseAnonKey) return null;
  try {
    return await withTimeout(
      (async () => {
        const [iRows, bRows] = await Promise.all([
          restGet<VisitImageRow>('visit_images'),
          restGet<InbodyRow>('inbody_records'),
        ]);
        return {
          visitImages: iRows.map(rowToImage),
          inbodyRecords: bRows.map(rowToInbody),
        };
      })(),
      timeoutMs,
      '사진/인바디 로드',
    );
  } catch (err) {
    console.error('[supabase] 사진/인바디 로드 실패 (앱은 계속 사용 가능)', err);
    return null;
  }
}

/** 수동 재시도용: 핵심 + 부가 데이터 전체 로드 (최대 1회 재시도, 4초 타임아웃). */
export async function loadAllFromSupabase(maxRetries = 1): Promise<LoadResult> {
  if (!isSupabaseEnabled || !supabase) {
    lastLoadErrorMessage = 'Supabase 환경변수가 설정되지 않았습니다.';
    return { status: 'error' };
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const critical = await loadCriticalFromSupabase(8000);
    if (critical.status === 'empty') return { status: 'empty' };
    if (critical.status === 'loaded') {
      const secondary = await loadSecondaryFromSupabase(4000);
      return {
        status: 'loaded',
        data: {
          patients: critical.data.patients,
          visits: critical.data.visits,
          visitImages: secondary?.visitImages ?? [],
          inbodyRecords: secondary?.inbodyRecords ?? [],
        },
      };
    }
    if (attempt < maxRetries) await sleep(300);
  }

  return { status: 'error' };
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
  if (error) throw error;
}

export async function persistVisit(v: Visit): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  const { error } = await supabase.from('visits').upsert(visitToRow(v));
  if (error) throw error;
}

export async function persistVisitImage(img: VisitImage, storagePath?: string): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  const { error } = await supabase.from('visit_images').upsert(imageToRow(img, storagePath));
  if (error) throw error;
}

export async function persistInbody(rec: InbodyRecord, storagePath?: string): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  const { error } = await supabase.from('inbody_records').upsert(inbodyToRow(rec, storagePath));
  if (error) throw error;
}

/* ──────────────────────────────────────────────
 * 관리자 계정 (모든 기기 공유용)
 * ────────────────────────────────────────────── */

export interface AdminRecord {
  id: string;
  name: string;
  pin: string;
}

/**
 * 관리자 목록 로드.
 * - 성공: AdminRecord[] (빈 배열이면 DB가 비어있음)
 * - 실패(에러): null → 호출측은 로컬값을 유지하고 덮어쓰지 않는다.
 */
export async function loadAdmins(): Promise<AdminRecord[] | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  try {
    const { data, error } = await supabase.from('admins').select('*').order('id');
    if (error) throw error;
    return (data as AdminRecord[]).map((r) => ({ id: r.id, name: r.name, pin: r.pin }));
  } catch (err) {
    console.error('[supabase] 관리자 로드 실패 — 로컬값 유지', err);
    return null;
  }
}

/** 관리자 목록 저장(upsert). id 기준으로 6개 행을 갱신한다. */
export async function persistAdmins(accounts: AdminRecord[]): Promise<boolean> {
  if (!isSupabaseEnabled || !supabase) return false;
  try {
    const rows = accounts.map((a) => ({ id: a.id, name: a.name, pin: a.pin }));
    const { error } = await supabase.from('admins').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[supabase] 관리자 저장 실패', err);
    return false;
  }
}

/* ──────────────────────────────────────────────
 * 파일 업로드 (Storage)
 * ────────────────────────────────────────────── */

/** 파일을 스토리지에 업로드 (최대 3회 재시도). */
export async function uploadFile(
  path: string,
  file: File,
  maxRetries = 2,
): Promise<{ publicUrl: string; path: string } | null> {
  if (!isSupabaseEnabled || !supabase) return null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { upsert: true, cacheControl: '3600' });
      if (error) throw error;
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      return { publicUrl: data.publicUrl, path };
    } catch (err) {
      console.error(`[supabase] 파일 업로드 실패 (${attempt + 1}/${maxRetries + 1})`, err);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
    }
  }
  return null;
}
