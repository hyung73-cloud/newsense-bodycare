import type {
  CalendarDay,
  ImageType,
  InbodyRecord,
  BodyShapeRecord,
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
  persistPatient,
  persistVisit,
  persistVisitImage,
  persistInbody,
  persistBodyShape,
  uploadFile,
  dedupeVisitImages,
  deleteOtherVisitImages,
  deleteVisitImagesByIds,
} from './supabaseData';
import { isPersistableMediaUrl, isSampleOrBlobUrl, pickBestImage } from '../lib/mediaUrl';

export { getSyncState, subscribeSync } from './syncEngine';
export type { SyncState, SyncStatus } from './syncEngine';

/** 초기 데이터 로드 완료 여부 — 완료 전 쓰기 차단 */
let dataInitComplete = false;
/** 서버 저장 실패 후 로컬만 남은 상태 */
let pendingServerSync = false;

export function isDataInitComplete(): boolean {
  return dataInitComplete || !isSupabaseEnabled;
}

export function hasPendingServerSync(): boolean {
  return pendingServerSync;
}

function markDataInitComplete(): void {
  dataInitComplete = true;
}

function newEntityId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `${prefix}-${Date.now()}-${rand}`;
}

/** 변경 내용을 서버에 저장하고, 성공 시에만 로컬 캐시를 확정한다. */
async function commitToServer(label: string, fn: () => Promise<void>): Promise<void> {
  lastMutationAt = Date.now();
  allowCacheWrite = true;

  if (!isSupabaseEnabled) {
    saveDataCache();
    markLocalSynced(label);
    pendingServerSync = false;
    return;
  }

  if (!dataInitComplete && !offlineMode) {
    throw new Error('데이터 로딩이 끝나기 전에는 저장할 수 없습니다. 잠시 후 다시 시도해주세요.');
  }

  await waitForAuthSession(8000);

  try {
    await runServerCommit(label, fn);
    pendingServerSync = false;
    saveDataCache();
  } catch (err) {
    pendingServerSync = true;
    saveDataCache();
    throw err;
  }
}

const _now = new Date();
const _pad = (n: number) => String(n).padStart(2, '0');
const _dow = ['일', '월', '화', '수', '목', '금', '토'][_now.getDay()];

/** 실제 오늘 날짜 (YYYY-MM-DD). 앱이 로드되는 날짜로 매일 자동 갱신된다. */
export const TODAY = `${_now.getFullYear()}-${_pad(_now.getMonth() + 1)}-${_pad(_now.getDate())}`;
/** 화면 표시용 오늘 날짜. 예: 2026.07.08 (수) */
export const TODAY_DISPLAY = `${_now.getFullYear()}.${_pad(_now.getMonth() + 1)}.${_pad(_now.getDate())} (${_dow})`;

export const staff: StaffInfo = { name: '김민수' };

export const patients: Patient[] = [];

export const visits: Visit[] = [];

export const visitImages: VisitImage[] = [];

export const inbodyRecords: InbodyRecord[] = [];

export const bodyShapeRecords: BodyShapeRecord[] = [];

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
  const AUTO_NOTE_PREFIXES = [
    '오늘 체형 사진 업로드',
    '그전 체형 사진 업로드',
    '패키지 등록:',
  ];

  const withNotes = visits
    .filter((v) => {
      if (v.hidden) return false;
      const note = v.doctorNote?.trim();
      if (!note) return false;
      return !AUTO_NOTE_PREFIXES.some((p) => note === p || note.startsWith(p));
    })
    .sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      if (byDate !== 0) return byDate;
      return (b.enteredAt || '').localeCompare(a.enteredAt || '');
    });

  const items: RecentMemo[] = [];
  for (const v of withNotes) {
    const patient = patients.find((p) => p.id === v.patientId);
    if (!patient) continue;
    items.push({
      id: `m-${v.id}`,
      date: v.date.replace(/-/g, '.'),
      patientName: patient.name,
      patientId: patient.id,
      summary: v.doctorNote.trim().slice(0, 80),
    });
    if (items.length >= limit) break;
  }
  return items;
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

export function getVisitImages(
  visitId: string,
  type: 'front' | 'side' | 'front_prev' | 'side_prev' | 'front_first' | 'side_first',
): VisitImage | undefined {
  const matches = visitImages.filter(
    (img) => img.visitId === visitId && img.type === type && img.url && !isSampleOrBlobUrl(img.url),
  );
  if (matches.length === 0) return undefined;
  return matches.reduce((best, img) => pickBestImage(best, img));
}

const BODY_PHOTO_TYPES: ImageType[] = [
  'front',
  'side',
  'front_prev',
  'side_prev',
  'front_first',
  'side_first',
];

function shiftDateYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

/** 체형 비교 슬롯: 방문 날짜 기준 그전 / 오늘 (같은 날 복제본 사용 안 함) */
export function getPhotoCompareSlots(
  patientId: string,
  type: 'front' | 'side',
): {
  prev?: { image: VisitImage; date: string; visitId: string };
  today?: { image: VisitImage; date: string; visitId: string };
} {
  const list = getVisitsByPatientId(patientId)
    .map((v) => {
      const image = getVisitImages(v.id, type);
      if (!image || !isPersistableMediaUrl(image.url)) return null;
      return { image, date: v.date, visitId: v.id };
    })
    .filter(Boolean) as { image: VisitImage; date: string; visitId: string }[];

  if (list.length === 0) return {};

  const todayItem = list.find((x) => x.date === TODAY) ?? (list[list.length - 1].date === TODAY ? list[list.length - 1] : undefined);
  const prevCandidates = list.filter((x) => x.date !== TODAY && (!todayItem || x.visitId !== todayItem.visitId));
  const prevItem = prevCandidates.length > 0 ? prevCandidates[prevCandidates.length - 1] : undefined;

  // 오늘 사진만 있으면 오늘만, 과거만 있으면 그전만
  if (todayItem && prevItem) return { prev: prevItem, today: todayItem };
  if (todayItem) return { today: todayItem };
  if (list.length >= 2) {
    return { prev: list[list.length - 2], today: list[list.length - 1] };
  }
  return { prev: list[0] };
}

function visitMetricsFrom(patientId: string) {
  const prev = getLatestVisit(patientId);
  return {
    weightKg: prev?.weightKg ?? 0,
    waistCm: prev?.waistCm ?? 0,
    bodyFatPct: prev?.bodyFatPct ?? 0,
    skeletalMuscleKg: prev?.skeletalMuscleKg ?? 0,
    visceralLevel: prev?.visceralLevel ?? 0,
    status: '진행중' as const,
    photoUploaded: false,
    inbodyUploaded: false,
  };
}

/** 사진 업로드용 — 오늘 방문이 없으면 생성 (서버 저장 완료까지 대기) */
export async function ensureTodayVisitForPhoto(patientId: string): Promise<Visit> {
  const existing = visits.find((v) => v.patientId === patientId && v.date === TODAY && !v.hidden);
  if (existing) return existing;

  return addVisitToday(patientId, {
    ...visitMetricsFrom(patientId),
    doctorNote: '오늘 체형 사진 업로드',
  });
}

/** 그전 사진용 — 오늘이 아닌 최근 방문, 없으면 어제 방문 생성 */
export async function ensurePrevVisitForPhoto(patientId: string): Promise<Visit> {
  const nonToday = getVisitsByPatientId(patientId).filter((v) => v.date !== TODAY);
  if (nonToday.length > 0) return nonToday[nonToday.length - 1];

  const date = shiftDateYmd(TODAY, -1);
  return addVisitOnDate(patientId, date, {
    ...visitMetricsFrom(patientId),
    doctorNote: '그전 체형 사진 업로드',
  });
}

export async function addVisitOnDate(patientId: string, date: string, data: VisitFormData): Promise<Visit> {
  const existing = visits.find((v) => v.patientId === patientId && v.date === date && !v.hidden);
  if (existing) return existing;

  const id = newEntityId('v');
  const visit: Visit = {
    id,
    patientId,
    date,
    ...data,
    enteredBy: staff.name,
    enteredAt: nowFormatted(),
    hidden: false,
  };
  visits.push(visit);
  syncPatientStats(patientId);
  recalcTodayStats();

  const patient = patients.find((p) => p.id === patientId);
  await commitToServer('방문 추가', async () => {
    if (patient) await persistPatient(patient);
    await persistVisit(visit);
  });

  return visit;
}

/** 환자 체형 사진(정면/측면/보관본) 전부 삭제 */
export async function clearPatientBodyPhotos(patientId: string): Promise<void> {
  const visitIds = visits.filter((v) => v.patientId === patientId).map((v) => v.id);
  const toRemove = visitImages.filter(
    (img) => visitIds.includes(img.visitId) && BODY_PHOTO_TYPES.includes(img.type),
  );
  const ids = toRemove.map((img) => img.id);
  if (ids.length === 0) return;

  for (let i = visitImages.length - 1; i >= 0; i--) {
    if (ids.includes(visitImages[i].id)) visitImages.splice(i, 1);
  }
  for (const vid of visitIds) {
    const visit = visits.find((v) => v.id === vid);
    if (!visit) continue;
    const hasFront = visitImages.some((img) => img.visitId === vid && img.type === 'front');
    const hasSide = visitImages.some((img) => img.visitId === vid && img.type === 'side');
    visit.photoUploaded = hasFront || hasSide;
  }
  syncPatientStats(patientId);

  await commitToServer('체형 사진 초기화', async () => {
    await deleteVisitImagesByIds(ids);
    for (const vid of visitIds) {
      const visit = visits.find((v) => v.id === vid);
      if (visit) await persistVisit(visit);
    }
  });
  saveDataCache();
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

export function getBodyShapeRecordsByPatient(
  patientId: string,
): (BodyShapeRecord & { date: string })[] {
  return getVisitsByPatientId(patientId)
    .map((v) => {
      const record = bodyShapeRecords.find((r) => r.visitId === v.id);
      if (!record) return null;
      return { ...record, date: v.date };
    })
    .filter(Boolean) as (BodyShapeRecord & { date: string })[];
}

export function getLatestBodyShape(patientId: string): BodyShapeRecord | undefined {
  const records = getBodyShapeRecordsByPatient(patientId);
  if (records.length === 0) return undefined;
  return records[records.length - 1];
}

export async function hideVisit(visitId: string): Promise<void> {
  const visit = visits.find((v) => v.id === visitId);
  if (!visit) return;
  visit.hidden = true;
  syncPatientStats(visit.patientId);
  recalcTodayStats();
  await commitToServer('방문 숨김', async () => {
    await persistVisit(visit);
    const patient = patients.find((p) => p.id === visit.patientId);
    if (patient) await persistPatient(patient);
  });
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

export async function addVisitToday(patientId: string, data: VisitFormData): Promise<Visit> {
  const id = newEntityId('v');
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

  syncPatientStats(patientId);
  recalcTodayStats();

  const patient = patients.find((p) => p.id === patientId);
  await commitToServer('방문 추가', async () => {
    if (patient) await persistPatient(patient);
    await persistVisit(visit);
  });

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

export async function createPatientWithTodayVisit(
  patientData: NewPatientFormData,
  visitData: VisitFormData,
): Promise<{ patient: Patient; visit: Visit }> {
  const id = newEntityId('p');
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
  const visit = await addVisitToday(id, {
    ...visitData,
    doctorNote: visitData.doctorNote || '신규 환자 등록 및 초진 기록',
  });
  return { patient, visit };
}

export async function registerReturningPatientToday(
  patientId: string,
  visitData: VisitFormData,
): Promise<Visit> {
  if (hasVisitToday(patientId)) {
    const existing = visits.find((v) => v.patientId === patientId && v.date === TODAY && !v.hidden)!;
    return (await updateVisit(existing.id, visitData))!;
  }
  const visit = await addVisitToday(patientId, visitData);
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
export async function registerPackageToday(input: PackageRegistrationInput): Promise<Visit> {
  const name = input.name.trim();
  const chart = input.chartNo.trim();

  let patient =
    (chart ? patients.find((p) => p.chartNo === chart) : undefined) ??
    patients.find((p) => p.name === name);

  if (!patient) {
    patient = {
      id: newEntityId('p'),
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
      id: newEntityId('v'),
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
  await commitToServer('패키지 등록', async () => {
    await persistPatient(targetPatient);
    await persistVisit(targetVisit);
  });

  return visit;
}

export interface PackageUpdateInput {
  packageName: string;
  packageTickets: PackageTicketLine[];
}

/** 오늘 방문 리스트에서 패키지 영수증 수정 */
export async function updateVisitPackage(
  visitId: string,
  input: PackageUpdateInput,
): Promise<Visit | undefined> {
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

  await commitToServer('패키지 수정', async () => {
    await persistVisit(visit);
  });

  return visit;
}

/** 방문에 연결된 패키지·시술권 정보 삭제 */
export async function clearVisitPackage(visitId: string): Promise<Visit | undefined> {
  const visit = visits.find((v) => v.id === visitId);
  if (!visit) return undefined;

  visit.packageName = undefined;
  visit.packageDetail = undefined;
  visit.packagePrice = undefined;
  visit.packageTickets = undefined;
  visit.enteredAt = nowFormatted();

  await commitToServer('패키지 삭제', async () => {
    await persistVisit(visit);
  });

  return visit;
}

export async function markLatestVisitInbodyUploaded(patientId: string): Promise<boolean> {
  const visit = getLatestVisit(patientId);
  if (!visit || visit.date !== TODAY) return false;

  visit.inbodyUploaded = true;
  if (visit.status === '미완료') visit.status = '진행중';

  recalcTodayStats();
  await commitToServer('인바디 완료', async () => {
    await persistVisit(visit);
    const inbody = inbodyRecords.find((r) => r.visitId === visit.id);
    if (inbody?.sheetImageUrl) await persistInbody(inbody);
  });
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

export async function setVisitPhotoFile(visitId: string, type: 'front' | 'side', file: File): Promise<string> {
  const url = assignObjectUrl(`photo-${visitId}-${type}`, file);
  const visit = visits.find((v) => v.id === visitId);
  const canonicalId = visitImageId(visitId, type);
  const prevType = type === 'front' ? 'front_prev' : 'side_prev';
  const prevId = visitImageId(visitId, prevType);
  const firstType = type === 'front' ? 'front_first' : 'side_first';
  const firstId = visitImageId(visitId, firstType);

  // 기존 현재 사진이 있으면 '이전'으로 보관 + 최초 사진은 1회만 고정
  const existingCurrent =
    visitImages.find((img) => img.id === canonicalId) ??
    visitImages.find((img) => img.visitId === visitId && img.type === type);
  if (existingCurrent && isPersistableMediaUrl(existingCurrent.url)) {
    let prevImg = visitImages.find((img) => img.id === prevId);
    if (!prevImg) {
      prevImg = {
        id: prevId,
        visitId,
        type: prevType,
        url: existingCurrent.url,
        weightKg: existingCurrent.weightKg,
        waistCm: existingCurrent.waistCm,
      };
      visitImages.push(prevImg);
    } else {
      prevImg.url = existingCurrent.url;
      prevImg.weightKg = existingCurrent.weightKg;
      prevImg.waistCm = existingCurrent.waistCm;
    }

    if (!visitImages.find((img) => img.id === firstId)) {
      visitImages.push({
        id: firstId,
        visitId,
        type: firstType,
        url: existingCurrent.url,
        weightKg: existingCurrent.weightKg,
        waistCm: existingCurrent.waistCm,
      });
    }
  }

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
    image.type = type;
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
  const archivedPrev = visitImages.find((x) => x.id === prevId);
  if (isSupabaseEnabled) {
    await commitToServer(`${type === 'front' ? '정면' : '측면'} 사진 저장`, async () => {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `photos/${visitId}/${type}-${Date.now()}.${ext}`;
      const uploaded = await uploadFile(path, file);
      if (!uploaded) throw new Error('사진 서버 저장에 실패했습니다. 다시 시도해주세요.');
      img.url = uploaded.publicUrl;
      await persistVisitImage(img, uploaded.path);
      if (archivedPrev && isPersistableMediaUrl(archivedPrev.url)) {
        await persistVisitImage(archivedPrev);
      }
      const archivedFirst = visitImages.find((x) => x.id === firstId);
      if (archivedFirst && isPersistableMediaUrl(archivedFirst.url)) {
        await persistVisitImage(archivedFirst);
      }
      await deleteOtherVisitImages(visitId, type, canonicalId);
      if (visit) {
        await persistVisit(visit);
        const p = patients.find((x) => x.id === visit.patientId);
        if (p) await persistPatient(p);
      }
    });
    saveDataCache();
  } else {
    saveDataCache();
  }

  return img.url;
}

/** OCR 자동입력 — 모든 환자에 활성 */
export function isInbodyOcrEnabledForPatient(_patient: Patient): boolean {
  return true;
}

/** OCR 파싱 결과를 환자·방문·인바디 수치에 반영 */
export async function applyInbodyOcrData(
  patientId: string,
  visitId: string,
  parsed: import('../lib/inbodyOcrTypes').InbodyParsedData,
): Promise<void> {
  const patient = patients.find((p) => p.id === patientId);
  const visit = visits.find((v) => v.id === visitId);
  if (!patient || !visit) return;

  if (parsed.heightCm != null && parsed.heightCm > 0) patient.heightCm = parsed.heightCm;
  if (parsed.age != null && parsed.age > 0) {
    patient.ageAtToday = Math.round(parsed.age);
    if (!patient.birth?.trim()) {
      const y = new Date().getFullYear() - Math.round(parsed.age);
      patient.birth = `${y}.01.01`;
    }
  }
  if (parsed.sex) patient.sex = parsed.sex;

  if (parsed.weightKg != null) visit.weightKg = parsed.weightKg;
  if (parsed.waistCm != null) visit.waistCm = parsed.waistCm;
  if (parsed.bodyFatPct != null) visit.bodyFatPct = parsed.bodyFatPct;
  if (parsed.skeletalMuscleKg != null) visit.skeletalMuscleKg = parsed.skeletalMuscleKg;
  if (parsed.visceralLevel != null) visit.visceralLevel = Math.round(parsed.visceralLevel);

  const summary = [
    parsed.weightKg != null ? `체중 ${parsed.weightKg}kg` : null,
    parsed.bodyFatPct != null ? `체지방 ${parsed.bodyFatPct}%` : null,
    parsed.skeletalMuscleKg != null ? `골격근 ${parsed.skeletalMuscleKg}kg` : null,
    parsed.visceralLevel != null ? `내장지방 ${parsed.visceralLevel}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  if (summary) {
    const tag = `인바디 OCR: ${summary}`;
    visit.doctorNote = visit.doctorNote?.trim() ? `${visit.doctorNote}\n${tag}` : tag;
  }

  let inbody = inbodyRecords.find((r) => r.visitId === visitId);
  if (!inbody) {
    inbody = {
      visitId,
      weightKg: visit.weightKg,
      skeletalMuscleKg: visit.skeletalMuscleKg,
      bodyFatPct: visit.bodyFatPct,
      visceralLevel: visit.visceralLevel,
      bmrKcal: parsed.bmrKcal ?? 0,
      abdominalFatRatio: parsed.abdominalFatRatio ?? 0,
      smi: parsed.smi ?? 0,
      sheetImageUrl: '',
    };
    inbodyRecords.push(inbody);
  } else {
    if (parsed.weightKg != null) inbody.weightKg = parsed.weightKg;
    if (parsed.skeletalMuscleKg != null) inbody.skeletalMuscleKg = parsed.skeletalMuscleKg;
    if (parsed.bodyFatPct != null) inbody.bodyFatPct = parsed.bodyFatPct;
    if (parsed.visceralLevel != null) inbody.visceralLevel = Math.round(parsed.visceralLevel);
    if (parsed.bmrKcal != null) inbody.bmrKcal = parsed.bmrKcal;
    if (parsed.abdominalFatRatio != null) inbody.abdominalFatRatio = parsed.abdominalFatRatio;
    if (parsed.smi != null) inbody.smi = parsed.smi;
  }

  visitImages
    .filter((img) => img.visitId === visitId)
    .forEach((img) => {
      if (parsed.weightKg != null) img.weightKg = parsed.weightKg;
      if (parsed.waistCm != null) img.waistCm = parsed.waistCm;
    });

  syncPatientStats(patientId);
  recalcTodayStats();

  const targetPatient = patient;
  const targetVisit = visit;
  const targetInbody = inbody;
  await commitToServer('인바디 OCR 자동입력', async () => {
    await persistPatient(targetPatient);
    await persistVisit(targetVisit);
    await persistInbody(targetInbody);
  });
}

/** 체형결과지 OCR — 복부 바깥둘레·안쪽둘레·지방두께 반영 */
export async function applyBodyShapeOcrData(
  visitId: string,
  parsed: import('../lib/bodyShapeParser').BodyShapeParsedData,
): Promise<void> {
  const visit = visits.find((v) => v.id === visitId);
  if (!visit) return;

  let record = bodyShapeRecords.find((r) => r.visitId === visitId);
  if (!record) {
    record = {
      visitId,
      outerCircumferenceCm: parsed.outerCircumferenceCm ?? 0,
      innerCircumferenceCm: parsed.innerCircumferenceCm ?? 0,
      fatThicknessMm: parsed.fatThicknessMm ?? 0,
      noteText: parsed.noteText || '',
      sheetImageUrl: '',
    };
    bodyShapeRecords.push(record);
  } else {
    if (parsed.outerCircumferenceCm != null) record.outerCircumferenceCm = parsed.outerCircumferenceCm;
    if (parsed.innerCircumferenceCm != null) record.innerCircumferenceCm = parsed.innerCircumferenceCm;
    if (parsed.fatThicknessMm != null) record.fatThicknessMm = parsed.fatThicknessMm;
    if (parsed.noteText) record.noteText = parsed.noteText;
  }

  if (parsed.noteText) {
    const tag = `체형 OCR: ${parsed.noteText}`;
    visit.doctorNote = visit.doctorNote?.trim() ? `${visit.doctorNote}\n${tag}` : tag;
  }

  const targetVisit = visit;
  const targetRecord = record;
  await commitToServer('체형결과지 OCR 자동입력', async () => {
    await persistVisit(targetVisit);
    await persistBodyShape(targetRecord);
  });
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
    saveDataCache();
  } else if (record) {
    saveDataCache();
  }

  return record?.sheetImageUrl ?? url;
}

export async function setBodyShapeSheetFile(visitId: string, file: File): Promise<string> {
  const url = assignObjectUrl(`body-shape-${visitId}`, file);
  const visit = visits.find((v) => v.id === visitId);
  let record = bodyShapeRecords.find((r) => r.visitId === visitId);
  if (record) {
    record.sheetImageUrl = url;
  } else {
    record = {
      visitId,
      outerCircumferenceCm: 0,
      innerCircumferenceCm: 0,
      fatThicknessMm: 0,
      noteText: '',
      sheetImageUrl: url,
    };
    bodyShapeRecords.push(record);
  }
  if (visit) {
    visit.inbodyUploaded = true;
    if (visit.status === '미완료') visit.status = '진행중';
    recalcTodayStats();
  }

  const target = record;
  if (isSupabaseEnabled && target) {
    await commitToServer('체형결과지 저장', async () => {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `body-shape/${visitId}/sheet-${Date.now()}.${ext}`;
      const uploaded = await uploadFile(path, file);
      if (!uploaded) throw new Error('체형결과지 서버 저장에 실패했습니다. 다시 시도해주세요.');
      target.sheetImageUrl = uploaded.publicUrl;
      await persistBodyShape(target, uploaded.path);
      if (visit) await persistVisit(visit);
    });
    saveDataCache();
  } else if (target) {
    saveDataCache();
  }

  return target?.sheetImageUrl ?? url;
}

export async function updateVisit(visitId: string, data: Partial<VisitFormData>): Promise<Visit | undefined> {
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

  await commitToServer('방문 수정', async () => {
    await persistVisit(visit);
    await Promise.all(imgs.map((img) => persistVisitImage(img)));
    if (inbody) await persistInbody(inbody);
    if (patient) await persistPatient(patient);
  });

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

/** 방문별 복부 바깥둘레·안쪽둘레·지방두께 그래프 데이터 */
export function getAbdomenChartData(patientId: string) {
  return getBodyShapeRecordsByPatient(patientId)
    .filter(
      (r) =>
        r.outerCircumferenceCm > 0 || r.innerCircumferenceCm > 0 || r.fatThicknessMm > 0,
    )
    .map((r) => ({
      date: r.date.slice(5).replace('-', '.'),
      outer: r.outerCircumferenceCm,
      inner: r.innerCircumferenceCm,
      fat: r.fatThicknessMm,
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

const DATA_CACHE_KEY = 'bodycare-data-cache-v2';
const LEGACY_DATA_CACHE_KEYS = ['bodycare-data-cache-v1'];

function clearLegacyDataCaches(): void {
  try {
    for (const key of LEGACY_DATA_CACHE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

interface DataCachePayload {
  patients: Patient[];
  visits: Visit[];
  visitImages: VisitImage[];
  inbodyRecords: InbodyRecord[];
  bodyShapeRecords?: BodyShapeRecord[];
  savedAt: string;
}

type SecondaryData = {
  visitImages: VisitImage[];
  inbodyRecords: InbodyRecord[];
  bodyShapeRecords: BodyShapeRecord[];
};

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

function mergeVisitImages(serverImages: VisitImage[]): void {
  // 서버가 권위. 업로드 직전 blob만 로컬에 유지.
  const localPending = visitImages.filter((img) => img.url.startsWith('blob:'));
  const serverIds = new Set(serverImages.map((img) => img.id));
  const keepLocal = localPending.filter((img) => !serverIds.has(img.id));
  replaceArray(visitImages, dedupeVisitImages([...serverImages, ...keepLocal]));
}

function mergeInbodyRecords(serverRecords: InbodyRecord[]): void {
  const byVisit = new Map(inbodyRecords.map((r) => [r.visitId, r]));
  for (const rec of serverRecords) {
    const prev = byVisit.get(rec.visitId);
    if (!prev) {
      byVisit.set(rec.visitId, rec);
      continue;
    }
    byVisit.set(rec.visitId, {
      ...prev,
      ...rec,
      sheetImageUrl: rec.sheetImageUrl || prev.sheetImageUrl,
    });
  }
  replaceArray(inbodyRecords, [...byVisit.values()]);
}

function mergeBodyShapeRecords(serverRecords: BodyShapeRecord[]): void {
  const byVisit = new Map(bodyShapeRecords.map((r) => [r.visitId, r]));
  for (const rec of serverRecords) {
    const prev = byVisit.get(rec.visitId);
    if (!prev) {
      byVisit.set(rec.visitId, rec);
      continue;
    }
    byVisit.set(rec.visitId, {
      ...prev,
      ...rec,
      sheetImageUrl: rec.sheetImageUrl || prev.sheetImageUrl,
      noteText: rec.noteText || prev.noteText,
    });
  }
  replaceArray(bodyShapeRecords, [...byVisit.values()]);
}

function applySecondaryOrCache(secondary: SecondaryData | null): void {
  if (!shouldApplyInitData()) {
    console.info('[init] 업로드 이후 초기화 완료 — 메모리 사진 데이터 유지');
    return;
  }

  if (secondary) {
    mergeVisitImages(secondary.visitImages);
    mergeInbodyRecords(secondary.inbodyRecords);
    mergeBodyShapeRecords(secondary.bodyShapeRecords ?? []);
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
    cache?.inbodyRecords?.filter((r) => visitIds.has(r.visitId)) ?? [];
  const cachedBody =
    cache?.bodyShapeRecords?.filter((r) => visitIds.has(r.visitId)) ?? [];
  if (cachedImages.length > 0) mergeVisitImages(cachedImages);
  if (cachedInbody.length > 0) mergeInbodyRecords(cachedInbody);
  if (cachedBody.length > 0) mergeBodyShapeRecords(cachedBody);
  if (cachedImages.length === 0 && cachedInbody.length === 0 && cachedBody.length === 0) {
    console.warn('[init] 사진/인바디 서버 로드 실패 — 캐시에도 유효한 이미지 없음');
  } else {
    console.warn('[init] 사진/인바디 서버 로드 실패 → 로컬 캐시 이미지 병합');
  }
}

function isPersistableUrl(url: string | undefined): boolean {
  return isPersistableMediaUrl(url);
}

function saveDataCache(): void {
  try {
    const visitIds = new Set(visits.map((v) => v.id));
    const payload: DataCachePayload = {
      patients: [...patients],
      visits: [...visits],
      visitImages: visitImages.filter((img) => isPersistableUrl(img.url)),
      inbodyRecords: inbodyRecords.filter((r) => visitIds.has(r.visitId)),
      bodyShapeRecords: bodyShapeRecords.filter((r) => visitIds.has(r.visitId)),
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

function applyDataCache(payload: DataCachePayload): void {
  replaceArray(patients, payload.patients);
  replaceArray(visits, payload.visits);
  replaceArray(
    visitImages,
    dedupeVisitImages(
      (payload.visitImages ?? []).filter((img) => isPersistableMediaUrl(img.url)),
    ),
  );
  replaceArray(inbodyRecords, payload.inbodyRecords ?? []);
  replaceArray(bodyShapeRecords, payload.bodyShapeRecords ?? []);
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
  markDataInitComplete();
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
    if (shouldApplyInitData()) {
      replaceArray(patients, []);
      replaceArray(visits, []);
      replaceArray(visitImages, []);
      replaceArray(inbodyRecords, []);
      replaceArray(bodyShapeRecords, []);
      recalcTodayStats();
      allowCacheWrite = true;
      saveDataCache();
    }
    markDataInitComplete();
    return true;
  }
  if (result.status === 'loaded') {
    if (shouldApplyInitData()) {
      replaceArray(patients, result.data.patients);
      replaceArray(visits, result.data.visits);
      replaceArray(visitImages, dedupeVisitImages(result.data.visitImages));
      replaceArray(inbodyRecords, result.data.inbodyRecords);
      replaceArray(bodyShapeRecords, result.data.bodyShapeRecords ?? []);
      recalcTodayStats();
      offlineMode = false;
      allowCacheWrite = true;
      saveDataCache();
    }
    markDataInitComplete();
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
  if (!isSupabaseEnabled) {
    markDataInitComplete();
    return;
  }

  clearLegacyDataCaches();
  initStartedAt = Date.now();
  await waitForAuthSession(5000);

  const result = await loadCriticalFromSupabase(10000);

  if (result.status === 'empty') {
    if (shouldApplyInitData()) {
      replaceArray(patients, []);
      replaceArray(visits, []);
      replaceArray(visitImages, []);
      replaceArray(inbodyRecords, []);
      replaceArray(bodyShapeRecords, []);
      recalcTodayStats();
      offlineMode = false;
      allowCacheWrite = true;
      saveDataCache();
    }
    markDataInitComplete();
    return;
  }

  if (result.status === 'loaded') {
    if (shouldApplyInitData()) {
      replaceArray(patients, result.data.patients);
      replaceArray(visits, result.data.visits);
      recalcTodayStats();
      offlineMode = false;
      allowCacheWrite = true;

      const secondary = await loadSecondaryFromSupabase(12000, 2);
      applySecondaryOrCache(secondary);
      saveDataCache();
    }
    markDataInitComplete();
    return;
  }

  const cache = loadDataCache();
  if (cache) {
    applyDataCache(cache);
    offlineMode = true;
    allowCacheWrite = true;
    markDataInitComplete();
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
