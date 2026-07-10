import type {
  CalendarDay,
  ImageType,
  InbodyRecord,
  PackageTicketLine,
  Patient,
  ProcedureTag,
  ProgressStats,
  RecentMemo,
  StaffInfo,
  TodayStats,
  Visit,
  VisitImage,
} from '../types';
import { isSupabaseEnabled } from '../lib/supabase';
import { waitForAuthSession } from '../auth/clinicAuth';
import { runServerCommit, markLocalSynced } from './syncEngine';
import {
  loadCriticalFromSupabase,
  loadSecondaryFromSupabase,
  loadAllFromSupabase,
  seedToSupabase,
  persistPatient,
  persistVisit,
  persistVisitImage,
  persistInbody,
  uploadFile,
  dedupeVisitImages,
  deleteOtherVisitImages,
  purgePatientsWithChartNos,
  purgePatientsExceptChartNos,
} from './supabaseData';
import { isPersistableMediaUrl, isSampleOrBlobUrl, pickBestImage } from '../lib/mediaUrl';

export { getSyncState, subscribeSync } from './syncEngine';
export type { SyncState, SyncStatus } from './syncEngine';

/** 변경 내용을 서버에 저장하고 로컬 캐시도 갱신한다. */
async function commitToServer(label: string, fn: () => Promise<void>): Promise<void> {
  lastMutationAt = Date.now();
  allowCacheWrite = true;
  if (!isSupabaseEnabled) {
    saveDataCache();
    markLocalSynced(label);
    return;
  }
  try {
    await runServerCommit(label, fn);
    saveDataCache();
  } catch (err) {
    saveDataCache();
    throw err;
  }
}

const PLACEHOLDER_FRONT =
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=280&fit=crop&crop=center';
const PLACEHOLDER_SIDE =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=280&fit=crop&crop=center';
const INBODY_SHEET =
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300&h=400&fit=crop';

void PLACEHOLDER_FRONT;
void PLACEHOLDER_SIDE;

const _now = new Date();
const _pad = (n: number) => String(n).padStart(2, '0');
const _dow = ['일', '월', '화', '수', '목', '금', '토'][_now.getDay()];

/** 실제 오늘 날짜 (YYYY-MM-DD). 앱이 로드되는 날짜로 매일 자동 갱신된다. */
export const TODAY = `${_now.getFullYear()}-${_pad(_now.getMonth() + 1)}-${_pad(_now.getDate())}`;
/** 화면 표시용 오늘 날짜. 예: 2026.07.08 (수) */
export const TODAY_DISPLAY = `${_now.getFullYear()}.${_pad(_now.getMonth() + 1)}.${_pad(_now.getDate())} (${_dow})`;

export const staff: StaffInfo = { name: '김민수' };

/** 운영 DB에서 삭제할 시드(테스트) 차트번호 */
export const TEST_SEED_CHART_NOS = ['000125', '000118', '000132', '000109', '000141', '000098'];

/** 실제 등록 환자 — 일회성 전체 정리 시 보존 */
export const PRODUCTION_CHART_NOS = ['8853'];

const ONE_TIME_PRODUCTION_PURGE_KEY = 'bodycare-production-purge-8853-v1';

export const patients: Patient[] = [];

export const visits: Visit[] = [];

export const visitImages: VisitImage[] = [];

export const inbodyRecords: InbodyRecord[] = [];

export const procedureTags: ProcedureTag[] = [
  { key: 'arginine', label: '아르기닌 수액요법', count: 0, patientIds: [] },
  { key: 'carboxy', label: '카복시테라피', count: 0, patientIds: [] },
  { key: 'liposuction', label: '부분 피하지방 시술', count: 0, patientIds: [] },
  { key: 'cnu', label: '씨앤유 처방', count: 0, patientIds: [] },
  { key: 'hba1c', label: '당화혈색소 검사', count: 0, patientIds: [] },
];

export const todayStats: TodayStats = {
  date: TODAY_DISPLAY,
  totalVisits: 0,
  newPatients: 0,
  photoUploaded: 0,
  inbodyUploaded: 0,
  incomplete: 0,
};

export const progressStats: ProgressStats = {
  total: 0,
  completed: 0,
  inProgress: 0,
  incomplete: 0,
};

export const recentMemos: RecentMemo[] = [];

function generateCalendarDays(year: number, month: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  // 실제 방문 데이터로 날짜별 집계 (신환: 시작일 == 방문일)
  const counts: Record<string, { total: number; newCount: number; returning: number }> = {};
  for (const v of visits) {
    if (v.hidden) continue;
    const entry = counts[v.date] ?? (counts[v.date] = { total: 0, newCount: 0, returning: 0 });
    entry.total += 1;
    const patient = patients.find((p) => p.id === v.patientId);
    const isNew = patient ? patient.startDate.replace(/\./g, '-') === v.date : false;
    if (isNew) entry.newCount += 1;
    else entry.returning += 1;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const data = counts[dateStr];
    days.push({
      date: dateStr,
      visitCount: data?.total ?? 0,
      newCount: data?.newCount ?? 0,
      returningCount: data?.returning ?? 0,
    });
  }
  return days;
}

// --- API-like getters ---

export function getStaff(): StaffInfo {
  return staff;
}

export function setStaffName(name: string): void {
  staff.name = name;
}

export function getTodayStats(): TodayStats {
  return todayStats;
}

export function getProgressStats(): ProgressStats {
  return progressStats;
}

export function getRecentMemos(limit = 3): RecentMemo[] {
  return recentMemos.slice(0, limit);
}

export function getRecentPatients(limit = 3): Patient[] {
  return [...patients]
    .filter((p) => Boolean(getLatestVisit(p.id)))
    .sort((a, b) => (b.lastVisitDate || '').localeCompare(a.lastVisitDate || ''))
    .slice(0, limit);
}

export function getTodayVisits(): (Visit & { patient: Patient; index: number })[] {
  const todayVisitList = visits
    .filter((v) => v.date === TODAY && !v.hidden)
    .map((v) => {
      const patient = patients.find((p) => p.id === v.patientId);
      if (!patient) return null;
      return { ...v, patient };
    })
    .filter((row): row is Visit & { patient: Patient } => row !== null);

  return todayVisitList.map((v, idx) => ({ ...v, index: idx + 1 }));
}

export function getCalendarDays(year: number, month: number): CalendarDay[] {
  return generateCalendarDays(year, month);
}

export function getProcedureTags(): ProcedureTag[] {
  return procedureTags;
}

export function getPatientsByProcedure(key: string): Patient[] {
  const tag = procedureTags.find((t) => t.key === key);
  if (!tag) return [];
  const uniqueIds = [...new Set(tag.patientIds)];
  return uniqueIds.map((id) => patients.find((p) => p.id === id)!).filter(Boolean);
}

export function getPatientById(id: string): Patient | undefined {
  return patients.find((p) => p.id === id);
}

export function getAllPatients(): Patient[] {
  return [...patients];
}

export function getVisitsByPatientId(patientId: string): Visit[] {
  return visits
    .filter((v) => v.patientId === patientId && !v.hidden)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getLatestVisit(patientId: string): Visit | undefined {
  const list = getVisitsByPatientId(patientId);
  return list[list.length - 1];
}

export function getPreviousVisit(patientId: string): Visit | undefined {
  const list = getVisitsByPatientId(patientId);
  return list.length >= 2 ? list[list.length - 2] : undefined;
}

export function getVisitImages(visitId: string, type: 'front' | 'side'): VisitImage | undefined {
  const matches = visitImages.filter(
    (img) => img.visitId === visitId && img.type === type && img.url && !isSampleOrBlobUrl(img.url),
  );
  if (matches.length === 0) return undefined;
  return matches.reduce((best, img) => pickBestImage(best, img));
}

function visitImageId(visitId: string, type: ImageType): string {
  return `img-${visitId}-${type}`;
}

function removeDuplicateVisitImagesInMemory(visitId: string, type: ImageType, keepId: string): void {
  for (let i = visitImages.length - 1; i >= 0; i--) {
    const img = visitImages[i];
    if (img.visitId === visitId && img.type === type && img.id !== keepId) {
      visitImages.splice(i, 1);
    }
  }
}

export function getInbodyRecordsByPatient(patientId: string): (InbodyRecord & { date: string })[] {
  const patientVisits = getVisitsByPatientId(patientId);
  return patientVisits
    .map((v) => {
      const record = inbodyRecords.find((r) => r.visitId === v.id);
      if (!record) return null;
      return { ...record, date: v.date };
    })
    .filter(Boolean) as (InbodyRecord & { date: string })[];
}

export function getLatestInbody(patientId: string): InbodyRecord | undefined {
  const records = getInbodyRecordsByPatient(patientId);
  if (records.length === 0) return undefined;
  return records[records.length - 1];
}

export function hideVisit(visitId: string): void {
  const visit = visits.find((v) => v.id === visitId);
  if (visit) {
    visit.hidden = true;
    syncPatientStats(visit.patientId);
    recalcTodayStats();
    void commitToServer('방문 숨김', async () => {
      await persistVisit(visit);
      const patient = patients.find((p) => p.id === visit.patientId);
      if (patient) await persistPatient(patient);
    }).catch((err) => console.error('[sync] 방문 숨김 저장 실패', err));
  }
}

export interface VisitFormData {
  weightKg: number;
  waistCm: number;
  bodyFatPct: number;
  skeletalMuscleKg: number;
  visceralLevel: number;
  doctorNote: string;
  status: Visit['status'];
  photoUploaded: boolean;
  inbodyUploaded: boolean;
}

function syncPatientStats(patientId: string): void {
  const patient = patients.find((p) => p.id === patientId);
  const visible = visits.filter((v) => v.patientId === patientId && !v.hidden);
  if (!patient) return;
  patient.totalVisits = visible.length;
  if (visible.length > 0) {
    const sorted = [...visible].sort((a, b) => a.date.localeCompare(b.date));
    patient.lastVisitDate = sorted[sorted.length - 1].date;
  }
}

function nowFormatted(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function addVisitToday(patientId: string, data: VisitFormData): Visit {
  const id = `v-${Date.now()}`;
  const visit: Visit = {
    id,
    patientId,
    date: TODAY,
    ...data,
    enteredBy: staff.name,
    enteredAt: nowFormatted(),
    hidden: false,
  };
  visits.push(visit);

  const inbody: InbodyRecord = {
    visitId: id,
    weightKg: data.weightKg,
    skeletalMuscleKg: data.skeletalMuscleKg,
    bodyFatPct: data.bodyFatPct,
    visceralLevel: data.visceralLevel,
    bmrKcal: 1178,
    abdominalFatRatio: 0.85,
    smi: 6.1,
    sheetImageUrl: '',
  };
  inbodyRecords.push(inbody);

  syncPatientStats(patientId);
  recalcTodayStats();

  const patient = patients.find((p) => p.id === patientId);
  void commitToServer('방문 추가', async () => {
    if (patient) await persistPatient(patient);
    await persistVisit(visit);
    // 사진·인바디는 실제 업로드 시에만 서버 저장 (placeholder URL 저장 방지)
  }).catch((err) => console.error('[sync] 방문 추가 저장 실패', err));

  return visit;
}

export interface NewPatientFormData {
  name: string;
  chartNo: string;
  sex?: import('../types').Sex;
  birth?: string;
  heightCm?: number;
  phone?: string;
}

const TODAY_INPUT_DRAFT_KEY = 'bodycare-today-input-draft-v1';

export function saveTodayInputDraft(data: unknown): void {
  localStorage.setItem(TODAY_INPUT_DRAFT_KEY, JSON.stringify(data));
}

export function loadTodayInputDraft<T>(): T | null {
  try {
    const raw = localStorage.getItem(TODAY_INPUT_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearTodayInputDraft(): void {
  localStorage.removeItem(TODAY_INPUT_DRAFT_KEY);
}

export function getNextChartNo(): string {
  const max = patients.reduce((acc, p) => Math.max(acc, parseInt(p.chartNo, 10) || 0), 0);
  return String(max + 1).padStart(6, '0');
}

function calcAgeFromBirth(birth: string): number {
  const year = parseInt(birth.split('.')[0], 10);
  if (Number.isNaN(year)) return 0;
  return Math.max(0, 2025 - year);
}

function recalcTodayStats(): void {
  const list = visits.filter((v) => v.date === TODAY && !v.hidden);
  const todayDot = TODAY.replace(/-/g, '.');

  todayStats.totalVisits = list.length;
  todayStats.newPatients = patients.filter((p) => p.startDate === todayDot).length;
  todayStats.photoUploaded = list.filter((v) => v.photoUploaded).length;
  todayStats.inbodyUploaded = list.filter((v) => v.inbodyUploaded).length;
  todayStats.incomplete = list.filter((v) => v.status === '미완료').length;

  progressStats.total = list.length;
  progressStats.completed = list.filter((v) => v.status === '완료').length;
  progressStats.inProgress = list.filter((v) => v.status === '진행중').length;
  progressStats.incomplete = list.filter((v) => v.status === '미완료').length;

  if (allowCacheWrite) saveDataCache();
}

function prependRecentMemo(patient: Patient, summary: string): void {
  recentMemos.unshift({
    id: `m-${Date.now()}`,
    date: todayStats.date.split(' ')[0],
    patientName: patient.name,
    patientId: patient.id,
    summary,
  });
  if (recentMemos.length > 10) recentMemos.pop();
}

export function createPatientWithTodayVisit(
  patientData: NewPatientFormData,
  visitData: VisitFormData,
): { patient: Patient; visit: Visit } {
  const id = `p-${Date.now()}`;
  const todayDot = TODAY.replace(/-/g, '.');
  const chartNo = patientData.chartNo.trim() || getNextChartNo();
  const birth = patientData.birth?.trim() ?? '';
  const patient: Patient = {
    id,
    chartNo,
    name: patientData.name.trim(),
    sex: patientData.sex ?? '여',
    birth,
    ageAtToday: birth ? calcAgeFromBirth(birth) : 0,
    heightCm: patientData.heightCm ?? 0,
    startDate: todayDot,
    totalVisits: 0,
    lastVisitDate: TODAY,
    phone: patientData.phone?.trim() || undefined,
  };
  patients.push(patient);
  const visit = addVisitToday(id, {
    ...visitData,
    doctorNote: visitData.doctorNote || '신규 환자 등록 및 초진 기록',
  });
  prependRecentMemo(patient, visit.doctorNote.slice(0, 40));
  return { patient, visit };
}

export function registerReturningPatientToday(
  patientId: string,
  visitData: VisitFormData,
): Visit {
  if (hasVisitToday(patientId)) {
    const existing = visits.find((v) => v.patientId === patientId && v.date === TODAY && !v.hidden)!;
    return updateVisit(existing.id, visitData)!;
  }
  const visit = addVisitToday(patientId, visitData);
  const patient = getPatientById(patientId);
  if (patient) prependRecentMemo(patient, visit.doctorNote.slice(0, 40));
  return visit;
}

export interface PackageRegistrationInput {
  name: string;
  chartNo: string;
  packageName: string;
  packageDetail?: string;
  packagePrice?: number;
  packageTickets?: PackageTicketLine[];
}

/**
 * 패키지 등록(공개 페이지)에서 호출.
 * 차트번호(없으면 이름)로 기존 환자를 찾고, 없으면 최소 정보로 신규 생성한 뒤,
 * 오늘 방문 기록에 결제한 패키지명을 기록한다. (오늘 방문 리스트에 자동 노출)
 */
export function registerPackageToday(input: PackageRegistrationInput): Visit {
  const name = input.name.trim();
  const chart = input.chartNo.trim();

  let patient =
    (chart ? patients.find((p) => p.chartNo === chart) : undefined) ??
    patients.find((p) => p.name === name);

  if (!patient) {
    patient = {
      id: `p-${Date.now()}`,
      chartNo: chart || getNextChartNo(),
      name: name || '미입력',
      sex: '여',
      birth: '',
      ageAtToday: 0,
      heightCm: 0,
      startDate: TODAY.replace(/-/g, '.'),
      totalVisits: 0,
      lastVisitDate: TODAY,
    };
    patients.push(patient);
  }

  let visit = visits.find((v) => v.patientId === patient!.id && v.date === TODAY && !v.hidden);
  if (visit) {
    visit.packageName = input.packageName;
    visit.packageDetail = input.packageDetail;
    visit.packagePrice = input.packagePrice;
    visit.packageTickets = input.packageTickets?.map((t) => ({ ...t }));
    if (!visit.doctorNote) visit.doctorNote = `패키지 등록: ${input.packageName}`;
  } else {
    visit = {
      id: `v-${Date.now()}`,
      patientId: patient.id,
      date: TODAY,
      weightKg: 0,
      waistCm: 0,
      bodyFatPct: 0,
      skeletalMuscleKg: 0,
      visceralLevel: 0,
      doctorNote: `패키지 등록: ${input.packageName}`,
      photoUploaded: false,
      inbodyUploaded: false,
      status: '미완료',
      enteredBy: '온라인 패키지',
      enteredAt: nowFormatted(),
      hidden: false,
      packageName: input.packageName,
      packageDetail: input.packageDetail,
      packagePrice: input.packagePrice,
      packageTickets: input.packageTickets?.map((t) => ({ ...t })),
    };
    visits.push(visit);
  }

  syncPatientStats(patient.id);
  recalcTodayStats();

  const targetPatient = patient;
  const targetVisit = visit;
  void commitToServer('패키지 등록', async () => {
    await persistPatient(targetPatient);
    await persistVisit(targetVisit);
  }).catch((err) => console.error('[sync] 패키지 등록 저장 실패', err));

  return visit;
}

export interface PackageUpdateInput {
  packageName: string;
  packageTickets: PackageTicketLine[];
}

/** 오늘 방문 리스트에서 패키지 영수증 수정 */
export function updateVisitPackage(visitId: string, input: PackageUpdateInput): Visit | undefined {
  const visit = visits.find((v) => v.id === visitId);
  if (!visit) return undefined;

  const tickets = input.packageTickets.map((t) => ({
    label: t.label.trim(),
    sub: t.sub?.trim() || undefined,
    price: Number.isFinite(t.price) ? t.price : 0,
  }));

  visit.packageName = input.packageName.trim();
  visit.packageTickets = tickets;
  visit.packageDetail = tickets.map((t) => t.label).join(', ');
  visit.packagePrice = tickets.reduce((sum, t) => sum + t.price, 0);
  visit.enteredAt = nowFormatted();

  void commitToServer('패키지 수정', async () => {
    await persistVisit(visit);
  }).catch((err) => console.error('[sync] 패키지 수정 저장 실패', err));

  return visit;
}

export function markLatestVisitInbodyUploaded(patientId: string): boolean {
  const visit = getLatestVisit(patientId);
  if (!visit || visit.date !== TODAY) return false;

  visit.inbodyUploaded = true;
  if (visit.status === '미완료') visit.status = '진행중';

  let inbody = inbodyRecords.find((r) => r.visitId === visit.id);
  if (!inbody) {
    inbody = {
      visitId: visit.id,
      weightKg: visit.weightKg,
      skeletalMuscleKg: visit.skeletalMuscleKg,
      bodyFatPct: visit.bodyFatPct,
      visceralLevel: visit.visceralLevel,
      bmrKcal: 1178,
      abdominalFatRatio: 0.85,
      smi: 6.1,
      sheetImageUrl: INBODY_SHEET,
    };
    inbodyRecords.push(inbody);
  }

  recalcTodayStats();
  void commitToServer('인바디 완료', async () => {
    await persistVisit(visit);
    await persistInbody(inbody!);
  }).catch((err) => console.error('[sync] 인바디 완료 저장 실패', err));
  return true;
}

/* ── 파일 업로드 (스토리지 + DB 영구 저장) ── */

const objectUrlRegistry = new Map<string, string>();

function assignObjectUrl(regKey: string, file: File): string {
  const prev = objectUrlRegistry.get(regKey);
  if (prev) URL.revokeObjectURL(prev);
  const url = URL.createObjectURL(file);
  objectUrlRegistry.set(regKey, url);
  return url;
}

export async function setVisitPhotoFile(visitId: string, type: ImageType, file: File): Promise<string> {
  const url = assignObjectUrl(`photo-${visitId}-${type}`, file);
  const visit = visits.find((v) => v.id === visitId);
  const canonicalId = visitImageId(visitId, type);

  let image = visitImages.find((img) => img.id === canonicalId);
  if (!image) {
    const existing = visitImages.find((img) => img.visitId === visitId && img.type === type);
    if (existing) {
      existing.id = canonicalId;
      image = existing;
    }
  }
  if (image) {
    image.url = url;
    image.id = canonicalId;
  } else {
    image = {
      id: canonicalId,
      visitId,
      type,
      url,
      weightKg: visit?.weightKg ?? 0,
      waistCm: visit?.waistCm ?? 0,
    };
    visitImages.push(image);
  }
  removeDuplicateVisitImagesInMemory(visitId, type, canonicalId);

  if (visit) {
    visit.photoUploaded = true;
    if (visit.status === '미완료') visit.status = '진행중';
    syncPatientStats(visit.patientId);
    recalcTodayStats();
  }

  const img = image;
  if (isSupabaseEnabled) {
    await commitToServer(`${type === 'front' ? '정면' : '측면'} 사진 저장`, async () => {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `photos/${visitId}/${type}-${Date.now()}.${ext}`;
      const uploaded = await uploadFile(path, file);
      if (!uploaded) throw new Error('사진 서버 저장에 실패했습니다. 다시 시도해주세요.');
      img.url = uploaded.publicUrl;
      await persistVisitImage(img, uploaded.path);
      await deleteOtherVisitImages(visitId, type, canonicalId);
      if (visit) {
        await persistVisit(visit);
        const p = patients.find((x) => x.id === visit.patientId);
        if (p) await persistPatient(p);
      }
    });
  } else {
    saveDataCache();
  }

  return img.url;
}

export async function setInbodySheetFile(visitId: string, file: File): Promise<string> {
  const url = assignObjectUrl(`inbody-${visitId}`, file);
  const visit = visits.find((v) => v.id === visitId);
  let inbody = inbodyRecords.find((r) => r.visitId === visitId);
  if (inbody) {
    inbody.sheetImageUrl = url;
  } else if (visit) {
    inbody = {
      visitId,
      weightKg: visit.weightKg,
      skeletalMuscleKg: visit.skeletalMuscleKg,
      bodyFatPct: visit.bodyFatPct,
      visceralLevel: visit.visceralLevel,
      bmrKcal: 1178,
      abdominalFatRatio: 0.85,
      smi: 6.1,
      sheetImageUrl: url,
    };
    inbodyRecords.push(inbody);
  }
  if (visit) {
    visit.inbodyUploaded = true;
    if (visit.status === '미완료') visit.status = '진행중';
    recalcTodayStats();
  }

  const record = inbody;
  if (isSupabaseEnabled && record) {
    await commitToServer('인바디 저장', async () => {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `inbody/${visitId}/sheet-${Date.now()}.${ext}`;
      const uploaded = await uploadFile(path, file);
      if (!uploaded) throw new Error('인바디 서버 저장에 실패했습니다. 다시 시도해주세요.');
      record.sheetImageUrl = uploaded.publicUrl;
      await persistInbody(record, uploaded.path);
      if (visit) await persistVisit(visit);
    });
  }

  return record?.sheetImageUrl ?? url;
}

export function updateVisit(visitId: string, data: Partial<VisitFormData>): Visit | undefined {
  const visit = visits.find((v) => v.id === visitId);
  if (!visit) return undefined;

  Object.assign(visit, data);

  const imgs = visitImages.filter((img) => img.visitId === visitId);
  imgs.forEach((img) => {
    if (data.weightKg !== undefined) img.weightKg = data.weightKg;
    if (data.waistCm !== undefined) img.waistCm = data.waistCm;
  });

  const inbody = inbodyRecords.find((r) => r.visitId === visitId);
  if (inbody) {
    if (data.weightKg !== undefined) inbody.weightKg = data.weightKg;
    if (data.skeletalMuscleKg !== undefined) inbody.skeletalMuscleKg = data.skeletalMuscleKg;
    if (data.bodyFatPct !== undefined) inbody.bodyFatPct = data.bodyFatPct;
    if (data.visceralLevel !== undefined) inbody.visceralLevel = data.visceralLevel;
  }

  visit.enteredAt = nowFormatted();
  syncPatientStats(visit.patientId);
  recalcTodayStats();

  const patient = patients.find((p) => p.id === visit.patientId);

  void commitToServer('방문 수정', async () => {
    await persistVisit(visit);
    await Promise.all(imgs.map((img) => persistVisitImage(img)));
    if (inbody) await persistInbody(inbody);
    if (patient) await persistPatient(patient);
  }).catch((err) => console.error('[sync] 방문 수정 저장 실패', err));

  return visit;
}

export function getVisitById(visitId: string): Visit | undefined {
  return visits.find((v) => v.id === visitId && !v.hidden);
}

export function hasVisitToday(patientId: string): boolean {
  return visits.some((v) => v.patientId === patientId && v.date === TODAY && !v.hidden);
}

export function searchPatients(query: string): Patient[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const digitsOnly = q.replace(/\D/g, '');
  return patients.filter((p) => {
    const nameMatch = p.name.toLowerCase().includes(q);
    const chartMatch = p.chartNo.includes(q);
    const birthMatch = p.birth.includes(q);
    const phoneDigits = (p.phone ?? '').replace(/\D/g, '');
    const phoneMatch = digitsOnly.length > 0 && phoneDigits.includes(digitsOnly);
    return nameMatch || chartMatch || birthMatch || phoneMatch;
  });
}

export function getTodayVisitsMissingPhoto(): (Visit & { patient: Patient })[] {
  return getTodayVisits().filter((v) => !v.photoUploaded);
}

export function getTodayVisitsMissingInbody(): (Visit & { patient: Patient })[] {
  return getTodayVisits().filter((v) => !v.inbodyUploaded);
}

export function getTodayVisitsIncomplete(): (Visit & { patient: Patient })[] {
  return getTodayVisits().filter((v) => v.status !== '완료');
}

export function getPatientVisitStats(patientId: string, visit: Visit) {
  const prev = getPreviousVisit(patientId);
  return {
    bodyFatChange: prev ? visit.bodyFatPct - prev.bodyFatPct : 0,
    muscleChange: prev ? visit.skeletalMuscleKg - prev.skeletalMuscleKg : 0,
    visceralChange: prev ? visit.visceralLevel - prev.visceralLevel : 0,
  };
}

export function getWeightChartData(patientId: string) {
  return getVisitsByPatientId(patientId).map((v) => ({
    date: v.date.slice(5).replace('-', '.'),
    value: v.weightKg,
  }));
}

export function getWaistChartData(patientId: string) {
  return getVisitsByPatientId(patientId).map((v) => ({
    date: v.date.slice(5).replace('-', '.'),
    value: v.waistCm,
  }));
}

export function getChangeChartData(patientId: string) {
  return getVisitsByPatientId(patientId).map((v) => ({
    date: v.date.slice(5).replace('-', '.'),
    weight: v.weightKg,
    muscle: v.skeletalMuscleKg,
    bodyFat: v.bodyFatPct,
    waist: v.waistCm,
  }));
}

export function getDoctorMemos(patientId: string, limit = 3): { date: string; note: string }[] {
  return getVisitsByPatientId(patientId)
    .filter((v) => v.doctorNote)
    .slice(-limit)
    .reverse()
    .map((v) => ({ date: v.date.replace(/-/g, '.'), note: v.doctorNote }));
}

export function getRecentPatientCardData(patientId: string) {
  const patient = getPatientById(patientId);
  const visit = getLatestVisit(patientId);
  if (!patient || !visit) return null;
  const frontImg = getVisitImages(visit.id, 'front');
  return {
    patient,
    visit,
    imageUrl: frontImg?.url ?? '',
    weightKg: visit.weightKg,
    waistCm: visit.waistCm,
    bodyFatPct: visit.bodyFatPct,
  };
}

/* ──────────────────────────────────────────────
 * Supabase 부트스트랩
 * 앱 시작 시 1회 호출. Supabase가 설정돼 있으면 DB에서 로드하고,
 * DB가 비어 있으면 현재 샘플 데이터를 시드한다.
 * Supabase 미설정 시에는 아무것도 하지 않아 기존 mock 동작 유지.
 * ────────────────────────────────────────────── */

function replaceArray<T>(target: T[], next: T[]): void {
  target.length = 0;
  target.push(...next);
}

let initPromise: Promise<void> | null = null;

const DATA_CACHE_KEY = 'bodycare-data-cache-v1';

interface DataCachePayload {
  patients: Patient[];
  visits: Visit[];
  visitImages: VisitImage[];
  inbodyRecords: InbodyRecord[];
  savedAt: string;
}

/** 로드 실패로 mock(샘플) 데이터를 표시 중인지 여부. true면 쓰기를 막아 DB 오염 방지. */
let dataLoadFailed = false;
/** 서버 연결 실패 후 로컬 캐시로 동작 중인지. */
let offlineMode = false;
let allowCacheWrite = false;
let lastMutationAt = 0;
let initStartedAt = 0;

function shouldApplyInitData(): boolean {
  return lastMutationAt <= initStartedAt;
}

function applySecondaryOrCache(secondary: SecondaryData | null): void {
  if (!shouldApplyInitData()) {
    console.info('[init] 업로드 이후 초기화 완료 — 메모리 사진 데이터 유지');
    return;
  }

  if (secondary) {
    replaceArray(visitImages, dedupeVisitImages(secondary.visitImages));
    replaceArray(inbodyRecords, secondary.inbodyRecords);
    return;
  }

  const cache = loadDataCache();
  const visitIds = new Set(visits.map((v) => v.id));
  const cachedImages = dedupeVisitImages(
    cache?.visitImages?.filter(
      (img) => visitIds.has(img.visitId) && isPersistableMediaUrl(img.url),
    ) ?? [],
  );
  const cachedInbody =
    cache?.inbodyRecords?.filter(
      (r) => visitIds.has(r.visitId) && isPersistableMediaUrl(r.sheetImageUrl),
    ) ?? [];
  replaceArray(visitImages, cachedImages);
  replaceArray(inbodyRecords, cachedInbody);
  if (cachedImages.length === 0 && cachedInbody.length === 0) {
    console.warn('[init] 사진/인바디 서버 로드 실패 — 캐시에도 유효한 이미지 없음');
  } else {
    console.warn('[init] 사진/인바디 서버 로드 실패 → 로컬 캐시 이미지 사용');
  }
}

function isPersistableUrl(url: string | undefined): boolean {
  return isPersistableMediaUrl(url);
}

function saveDataCache(): void {
  try {
    const payload: DataCachePayload = {
      patients: [...patients],
      visits: [...visits],
      visitImages: visitImages.filter((img) => isPersistableUrl(img.url)),
      inbodyRecords: inbodyRecords.filter((r) => isPersistableUrl(r.sheetImageUrl)),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DATA_CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[cache] 로컬 저장 실패', err);
  }
}

function loadDataCache(): DataCachePayload | null {
  try {
    const raw = localStorage.getItem(DATA_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DataCachePayload;
    if (!Array.isArray(parsed.patients) || parsed.patients.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function filterCacheToPreserved(payload: DataCachePayload): DataCachePayload {
  const keptPatients = payload.patients.filter((p) => !TEST_SEED_CHART_NOS.includes(p.chartNo));
  const keptPatientIds = new Set(keptPatients.map((p) => p.id));
  const keptVisits = payload.visits.filter((v) => keptPatientIds.has(v.patientId));
  const keptVisitIds = new Set(keptVisits.map((v) => v.id));
  return {
    ...payload,
    patients: keptPatients,
    visits: keptVisits,
    visitImages: (payload.visitImages ?? []).filter((img) => keptVisitIds.has(img.visitId)),
    inbodyRecords: (payload.inbodyRecords ?? []).filter((r) => keptVisitIds.has(r.visitId)),
  };
}

async function purgeAndReloadCritical(): Promise<{ patients: Patient[]; visits: Visit[] } | null> {
  try {
    let removed = 0;
    if (!localStorage.getItem(ONE_TIME_PRODUCTION_PURGE_KEY)) {
      removed += await purgePatientsExceptChartNos(PRODUCTION_CHART_NOS);
      localStorage.setItem(ONE_TIME_PRODUCTION_PURGE_KEY, new Date().toISOString());
    }
    removed += await purgePatientsWithChartNos(TEST_SEED_CHART_NOS);
    if (removed === 0) return null;
    const refreshed = await loadCriticalFromSupabase(10000);
    if (refreshed.status === 'loaded') return refreshed.data;
  } catch (err) {
    console.error('[init] 테스트 데이터 정리 실패', err);
  }
  return null;
}

function applyDataCache(payload: DataCachePayload): void {
  const filtered = filterCacheToPreserved(payload);
  replaceArray(patients, filtered.patients);
  replaceArray(visits, filtered.visits);
  replaceArray(
    visitImages,
    dedupeVisitImages(
      (filtered.visitImages ?? []).filter((img) => isPersistableMediaUrl(img.url)),
    ),
  );
  replaceArray(
    inbodyRecords,
    (filtered.inbodyRecords ?? []).filter((r) => isPersistableMediaUrl(r.sheetImageUrl)),
  );
  recalcTodayStats();
}

/** 서버 연결 실패 후 로컬 캐시 사용 중인지. */
export function isOfflineMode(): boolean {
  return offlineMode;
}

/** 로컬 캐시 저장 시각 (ISO 문자열). */
export function getOfflineCacheTime(): string | null {
  return loadDataCache()?.savedAt ?? null;
}

/** 로컬 캐시가 있는지 (오프라인 폴백 가능 여부). */
export function hasLocalDataCache(): boolean {
  return loadDataCache() !== null;
}

/** 서버 연결 없이 로컬 캐시만으로 앱 시작. */
export function activateLocalCache(): boolean {
  const cache = loadDataCache();
  if (!cache) return false;
  applyDataCache(cache);
  offlineMode = true;
  dataLoadFailed = false;
  allowCacheWrite = true;
  return true;
}

/** Supabase 로드 실패 여부 (실패 시 앱은 편집을 막고 재시도 화면을 보여준다). */
export function hasDataLoadError(): boolean {
  return dataLoadFailed;
}

/** 로드 실패 후 재시도. 성공 시 true. */
export async function retryInitData(): Promise<boolean> {
  initPromise = null;
  dataLoadFailed = false;
  initStartedAt = Date.now();
  await waitForAuthSession(10000);

  const result = await loadAllFromSupabase(2);
  if (result.status === 'empty') {
    if (!shouldApplyInitData()) return true;
    await seedToSupabase({ patients, visits, visitImages, inbodyRecords });
    recalcTodayStats();
    allowCacheWrite = true;
    saveDataCache();
    return true;
  }
  if (result.status === 'loaded') {
    if (!shouldApplyInitData()) return true;
    const purged = await purgeAndReloadCritical();
    if (purged) {
      replaceArray(patients, purged.patients);
      replaceArray(visits, purged.visits);
      const secondary = await loadSecondaryFromSupabase(12000, 2);
      applySecondaryOrCache(secondary);
    } else {
      replaceArray(patients, result.data.patients);
      replaceArray(visits, result.data.visits);
      replaceArray(visitImages, dedupeVisitImages(result.data.visitImages));
      replaceArray(inbodyRecords, result.data.inbodyRecords);
    }
    recalcTodayStats();
    offlineMode = false;
    allowCacheWrite = true;
    saveDataCache();
    return true;
  }
  if (loadDataCache()) {
    activateLocalCache();
    return false;
  }
  dataLoadFailed = true;
  return false;
}

async function doInit(): Promise<void> {
  if (!isSupabaseEnabled) return;

  initStartedAt = Date.now();
  await waitForAuthSession(5000);

  const result = await loadCriticalFromSupabase(10000);

  if (result.status === 'empty') {
    if (!shouldApplyInitData()) return;
    await seedToSupabase({ patients, visits, visitImages, inbodyRecords });
    recalcTodayStats();
    offlineMode = false;
    allowCacheWrite = true;
    saveDataCache();
    return;
  }

  if (result.status === 'loaded') {
    if (!shouldApplyInitData()) return;
    const purged = await purgeAndReloadCritical();
    if (purged) {
      replaceArray(patients, purged.patients);
      replaceArray(visits, purged.visits);
    } else {
      replaceArray(patients, result.data.patients);
      replaceArray(visits, result.data.visits);
    }
    recalcTodayStats();
    offlineMode = false;
    allowCacheWrite = true;

    const secondary = await loadSecondaryFromSupabase(12000, 2);
    applySecondaryOrCache(secondary);
    saveDataCache();
    return;
  }

  const cache = loadDataCache();
  if (cache) {
    applyDataCache(cache);
    offlineMode = true;
    allowCacheWrite = true;
    console.warn('[init] 서버 연결 실패 → 로컬 캐시 사용', cache.savedAt);
    return;
  }

  dataLoadFailed = true;
}

/** 앱 시작 시 1회 호출. 동시 호출 시 같은 로드 Promise를 공유한다. */
export function initData(): Promise<void> {
  if (!initPromise) initPromise = doInit();
  return initPromise;
}

/** 로그인·세션 복원 후 데이터를 다시 불러올 때 init Promise 초기화. */
export function resetInitPromise(): void {
  initPromise = null;
  initStartedAt = 0;
}

recalcTodayStats();
