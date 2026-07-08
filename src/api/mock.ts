import type {
  CalendarDay,
  ImageType,
  InbodyRecord,
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
import {
  loadAllFromSupabase,
  seedToSupabase,
  persistPatient,
  persistVisit,
  persistVisitImage,
  persistInbody,
  uploadFile,
} from './supabaseData';

const PLACEHOLDER_FRONT =
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=280&fit=crop&crop=center';
const PLACEHOLDER_SIDE =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=280&fit=crop&crop=center';
const INBODY_SHEET =
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300&h=400&fit=crop';

export const TODAY = '2025-12-16';
export const TODAY_DISPLAY = '2025.12.16 (화)';

export const staff: StaffInfo = { name: '김민수' };

export const patients: Patient[] = [
  {
    id: 'p1',
    chartNo: '000125',
    name: '김뉴센',
    sex: '여',
    birth: '1999.11.25',
    ageAtToday: 26,
    heightCm: 162,
    startDate: '2025.11.25',
    totalVisits: 3,
    lastVisitDate: '2025.12.16',
    phone: '010-1234-5678',
  },
  {
    id: 'p2',
    chartNo: '000118',
    name: '이건강',
    sex: '남',
    birth: '1988.03.14',
    ageAtToday: 37,
    heightCm: 175,
    startDate: '2025.12.10',
    totalVisits: 2,
    lastVisitDate: '2025.12.16',
    phone: '010-2222-3456',
  },
  {
    id: 'p3',
    chartNo: '000132',
    name: '박다이어트',
    sex: '여',
    birth: '1992.07.08',
    ageAtToday: 33,
    heightCm: 158,
    startDate: '2025.12.14',
    totalVisits: 1,
    lastVisitDate: '2025.12.16',
    phone: '010-3333-7890',
  },
  {
    id: 'p4',
    chartNo: '000109',
    name: '최슬림',
    sex: '여',
    birth: '1985.01.20',
    ageAtToday: 40,
    heightCm: 165,
    startDate: '2025.10.05',
    totalVisits: 8,
    lastVisitDate: '2025.12.16',
    phone: '010-4444-1234',
  },
  {
    id: 'p5',
    chartNo: '000141',
    name: '정바디',
    sex: '남',
    birth: '1995.09.30',
    ageAtToday: 30,
    heightCm: 178,
    startDate: '2025.12.16',
    totalVisits: 1,
    lastVisitDate: '2025.12.16',
    phone: '010-5555-9876',
  },
  {
    id: 'p6',
    chartNo: '000098',
    name: '한웰니스',
    sex: '여',
    birth: '1978.12.02',
    ageAtToday: 47,
    heightCm: 160,
    startDate: '2025.09.01',
    totalVisits: 12,
    lastVisitDate: '2025.12.16',
    phone: '010-6666-4321',
  },
];

export const visits: Visit[] = [
  // 김뉴센 - 3 visits
  {
    id: 'v1',
    patientId: 'p1',
    date: '2025.11.25',
    weightKg: 72.5,
    waistCm: 88,
    bodyFatPct: 43.2,
    skeletalMuscleKg: 19.6,
    visceralLevel: 13,
    doctorNote: '초진. 체중관리 프로그램 시작. 식이조절 및 유산소 운동 권고.',
    photoUploaded: true,
    inbodyUploaded: true,
    status: '완료',
    enteredBy: '김실장',
    enteredAt: '2025.11.25 10:30',
    hidden: false,
  },
  {
    id: 'v2',
    patientId: 'p1',
    date: '2025.12.02',
    weightKg: 71.2,
    waistCm: 86,
    bodyFatPct: 41.5,
    skeletalMuscleKg: 19.8,
    visceralLevel: 12,
    doctorNote: '1주차 재진. 체중 1.3kg 감소. 식단 준수 양호.',
    photoUploaded: true,
    inbodyUploaded: true,
    status: '완료',
    enteredBy: '김실장',
    enteredAt: '2025.12.02 11:00',
    hidden: false,
  },
  {
    id: 'v3',
    patientId: 'p1',
    date: '2025.12.16',
    weightKg: 70.0,
    waistCm: 84,
    bodyFatPct: 40.0,
    skeletalMuscleKg: 20.0,
    visceralLevel: 12,
    doctorNote: '3주차 재진. 체지방률 3.2%p 감소. 골격근량 유지 양호. 다음 방문 2주 후.',
    photoUploaded: true,
    inbodyUploaded: true,
    status: '완료',
    enteredBy: '김실장',
    enteredAt: '2025.12.16 10:40',
    hidden: false,
  },
  // 이건강
  {
    id: 'v4',
    patientId: 'p2',
    date: '2025.12.10',
    weightKg: 85.0,
    waistCm: 92,
    bodyFatPct: 28.5,
    skeletalMuscleKg: 32.0,
    visceralLevel: 10,
    doctorNote: '초진. 복부비만 위주. 근력운동 병행 권고.',
    photoUploaded: true,
    inbodyUploaded: true,
    status: '완료',
    enteredBy: '김실장',
    enteredAt: '2025.12.10 14:20',
    hidden: false,
  },
  {
    id: 'v5',
    patientId: 'p2',
    date: '2025.12.16',
    weightKg: 83.5,
    waistCm: 90,
    bodyFatPct: 27.8,
    skeletalMuscleKg: 32.2,
    visceralLevel: 9,
    doctorNote: '재진. 체중 감소 추세 양호.',
    photoUploaded: true,
    inbodyUploaded: true,
    status: '완료',
    enteredBy: '김실장',
    enteredAt: '2025.12.16 09:15',
    hidden: false,
  },
  // 박다이어트 - 신규
  {
    id: 'v6',
    patientId: 'p3',
    date: '2025.12.16',
    weightKg: 68.0,
    waistCm: 82,
    bodyFatPct: 35.0,
    skeletalMuscleKg: 22.0,
    visceralLevel: 8,
    doctorNote: '신규 등록. 목표 체중 60kg.',
    photoUploaded: true,
    inbodyUploaded: false,
    status: '미완료',
    enteredBy: '김실장',
    enteredAt: '2025.12.16 11:30',
    hidden: false,
  },
  // 최슬림
  {
    id: 'v7',
    patientId: 'p4',
    date: '2025.12.16',
    weightKg: 62.0,
    waistCm: 74,
    bodyFatPct: 30.5,
    skeletalMuscleKg: 24.5,
    visceralLevel: 6,
    doctorNote: '정기 재진. 유지기 관리 중.',
    photoUploaded: true,
    inbodyUploaded: true,
    status: '완료',
    enteredBy: '김실장',
    enteredAt: '2025.12.16 10:00',
    hidden: false,
  },
  // 정바디 - 신규, 진행중
  {
    id: 'v8',
    patientId: 'p5',
    date: '2025.12.16',
    weightKg: 92.0,
    waistCm: 98,
    bodyFatPct: 32.0,
    skeletalMuscleKg: 35.0,
    visceralLevel: 14,
    doctorNote: '신규 등록. 인바디 대기 중.',
    photoUploaded: true,
    inbodyUploaded: false,
    status: '진행중',
    enteredBy: '김실장',
    enteredAt: '2025.12.16 11:45',
    hidden: false,
  },
  // 한웰니스
  {
    id: 'v9',
    patientId: 'p6',
    date: '2025.12.16',
    weightKg: 58.5,
    waistCm: 72,
    bodyFatPct: 28.0,
    skeletalMuscleKg: 23.0,
    visceralLevel: 5,
    doctorNote: '장기 관리 환자. 현재 상태 양호.',
    photoUploaded: true,
    inbodyUploaded: true,
    status: '완료',
    enteredBy: '김실장',
    enteredAt: '2025.12.16 08:50',
    hidden: false,
  },
];

export const visitImages: VisitImage[] = [
  { id: 'img1', visitId: 'v1', type: 'front', url: PLACEHOLDER_FRONT, weightKg: 72.5, waistCm: 88 },
  { id: 'img2', visitId: 'v1', type: 'side', url: PLACEHOLDER_SIDE, weightKg: 72.5, waistCm: 88 },
  { id: 'img3', visitId: 'v2', type: 'front', url: PLACEHOLDER_FRONT, weightKg: 71.2, waistCm: 86 },
  { id: 'img4', visitId: 'v2', type: 'side', url: PLACEHOLDER_SIDE, weightKg: 71.2, waistCm: 86 },
  { id: 'img5', visitId: 'v3', type: 'front', url: PLACEHOLDER_FRONT, weightKg: 70.0, waistCm: 84 },
  { id: 'img6', visitId: 'v3', type: 'side', url: PLACEHOLDER_SIDE, weightKg: 70.0, waistCm: 84 },
];

export const inbodyRecords: InbodyRecord[] = [
  {
    visitId: 'v1',
    weightKg: 72.5,
    skeletalMuscleKg: 19.6,
    bodyFatPct: 43.2,
    visceralLevel: 13,
    bmrKcal: 1205,
    abdominalFatRatio: 0.92,
    smi: 5.8,
    sheetImageUrl: INBODY_SHEET,
  },
  {
    visitId: 'v2',
    weightKg: 71.2,
    skeletalMuscleKg: 19.8,
    bodyFatPct: 41.5,
    visceralLevel: 12,
    bmrKcal: 1190,
    abdominalFatRatio: 0.88,
    smi: 5.9,
    sheetImageUrl: INBODY_SHEET,
  },
  {
    visitId: 'v3',
    weightKg: 70.0,
    skeletalMuscleKg: 20.0,
    bodyFatPct: 40.0,
    visceralLevel: 12,
    bmrKcal: 1178,
    abdominalFatRatio: 0.85,
    smi: 6.1,
    sheetImageUrl: INBODY_SHEET,
  },
];

export const procedureTags: ProcedureTag[] = [
  { key: 'arginine', label: '아르기닌 수액요법', count: 5, patientIds: ['p1', 'p2', 'p4', 'p5', 'p6'] },
  { key: 'carboxy', label: '카복시테라피', count: 3, patientIds: ['p1', 'p3', 'p4'] },
  { key: 'liposuction', label: '부분 피하지방 시술', count: 4, patientIds: ['p2', 'p4', 'p5', 'p6'] },
  { key: 'cnu', label: '씨앤유 처방', count: 7, patientIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p2'] },
  { key: 'hba1c', label: '당화혈색소 검사', count: 2, patientIds: ['p4', 'p6'] },
];

export const todayStats: TodayStats = {
  date: TODAY_DISPLAY,
  totalVisits: 18,
  newPatients: 3,
  photoUploaded: 17,
  inbodyUploaded: 16,
  incomplete: 2,
};

export const progressStats: ProgressStats = {
  total: 18,
  completed: 16,
  inProgress: 1,
  incomplete: 1,
};

export const recentMemos: RecentMemo[] = [
  {
    id: 'm1',
    date: '2025.12.16',
    patientName: '김뉴센',
    patientId: 'p1',
    summary: '체지방률 3.2%p 감소. 골격근량 유지 양호.',
  },
  {
    id: 'm2',
    date: '2025.12.16',
    patientName: '이건강',
    patientId: 'p2',
    summary: '체중 1.5kg 감소. 식단 준수 양호.',
  },
  {
    id: 'm3',
    date: '2025.12.15',
    patientName: '최슬림',
    patientId: 'p4',
    summary: '유지기 관리. 다음 방문 4주 후 예정.',
  },
];

function generateCalendarDays(year: number, month: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  const visitMap: Record<string, { total: number; newCount: number; returning: number }> = {
    '2025-12-02': { total: 12, newCount: 1, returning: 11 },
    '2025-12-09': { total: 15, newCount: 2, returning: 13 },
    '2025-12-10': { total: 10, newCount: 2, returning: 8 },
    '2025-12-14': { total: 8, newCount: 1, returning: 7 },
    '2025-12-16': { total: 18, newCount: 3, returning: 15 },
  };

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const data = visitMap[dateStr];
    days.push({
      date: dateStr,
      visitCount: data?.total ?? 0,
      newCount: data?.newCount ?? 0,
      returningCount: data?.returning ?? 0,
    });
  }
  return days;
}

export const calendarDays = generateCalendarDays(2025, 12);

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
    .sort((a, b) => b.lastVisitDate.localeCompare(a.lastVisitDate))
    .slice(0, limit);
}

export function getTodayVisits(): (Visit & { patient: Patient; index: number })[] {
  const todayVisitList = visits
    .filter((v) => v.date === TODAY && !v.hidden)
    .map((v) => ({
      ...v,
      patient: patients.find((p) => p.id === v.patientId)!,
    }));

  return todayVisitList.map((v, idx) => ({ ...v, index: idx + 1 }));
}

export function getCalendarDays(year: number, month: number): CalendarDay[] {
  if (year === 2025 && month === 12) return calendarDays;
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
  return visitImages.find((img) => img.visitId === visitId && img.type === type);
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
    persistVisit(visit);
    const patient = patients.find((p) => p.id === visit.patientId);
    if (patient) persistPatient(patient);
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

  const frontImg: VisitImage = {
    id: `img-${id}-f`,
    visitId: id,
    type: 'front',
    url: PLACEHOLDER_FRONT,
    weightKg: data.weightKg,
    waistCm: data.waistCm,
  };
  const sideImg: VisitImage = {
    id: `img-${id}-s`,
    visitId: id,
    type: 'side',
    url: PLACEHOLDER_SIDE,
    weightKg: data.weightKg,
    waistCm: data.waistCm,
  };
  visitImages.push(frontImg, sideImg);

  const inbody: InbodyRecord = {
    visitId: id,
    weightKg: data.weightKg,
    skeletalMuscleKg: data.skeletalMuscleKg,
    bodyFatPct: data.bodyFatPct,
    visceralLevel: data.visceralLevel,
    bmrKcal: 1178,
    abdominalFatRatio: 0.85,
    smi: 6.1,
    sheetImageUrl: INBODY_SHEET,
  };
  inbodyRecords.push(inbody);

  syncPatientStats(patientId);
  recalcTodayStats();

  const patient = patients.find((p) => p.id === patientId);
  void (async () => {
    if (patient) await persistPatient(patient); // FK: 환자 먼저
    await persistVisit(visit); // FK: 방문 다음
    await Promise.all([
      persistVisitImage(frontImg),
      persistVisitImage(sideImg),
      persistInbody(inbody),
    ]);
  })();

  return visit;
}

export interface NewPatientFormData {
  name: string;
  sex: import('../types').Sex;
  birth: string;
  heightCm: number;
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
  const patient: Patient = {
    id,
    chartNo: getNextChartNo(),
    name: patientData.name.trim(),
    sex: patientData.sex,
    birth: patientData.birth.trim(),
    ageAtToday: calcAgeFromBirth(patientData.birth),
    heightCm: patientData.heightCm,
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
  void persistVisit(visit);
  void persistInbody(inbody);
  return true;
}

/* ── 브라우저 임시 업로드 (백엔드 없음, 새로고침 시 초기화) ── */

const objectUrlRegistry = new Map<string, string>();

function assignObjectUrl(regKey: string, file: File): string {
  const prev = objectUrlRegistry.get(regKey);
  if (prev) URL.revokeObjectURL(prev);
  const url = URL.createObjectURL(file);
  objectUrlRegistry.set(regKey, url);
  return url;
}

export function setVisitPhotoFile(visitId: string, type: ImageType, file: File): string {
  const url = assignObjectUrl(`photo-${visitId}-${type}`, file);
  const visit = visits.find((v) => v.id === visitId);
  let image = visitImages.find((img) => img.visitId === visitId && img.type === type);
  if (image) {
    image.url = url;
  } else {
    image = {
      id: `img-${visitId}-${type}-upload`,
      visitId,
      type,
      url,
      weightKg: visit?.weightKg ?? 0,
      waistCm: visit?.waistCm ?? 0,
    };
    visitImages.push(image);
  }
  if (visit) {
    visit.photoUploaded = true;
    if (visit.status === '미완료') visit.status = '진행중';
    syncPatientStats(visit.patientId);
    recalcTodayStats();
  }

  // 백그라운드로 스토리지 업로드 후 영구 URL로 교체 + DB 저장
  const img = image;
  if (isSupabaseEnabled) {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `photos/${visitId}/${type}-${Date.now()}.${ext}`;
    void (async () => {
      const uploaded = await uploadFile(path, file);
      if (!uploaded) {
        // 업로드 실패: 임시(blob) 주소를 DB에 저장하면 새로고침 시 깨지므로 저장하지 않는다.
        console.error('[upload] 사진 스토리지 업로드 실패 — 영구 저장을 건너뜁니다.');
        return;
      }
      img.url = uploaded.publicUrl;
      await persistVisitImage(img, uploaded.path);
      if (visit) {
        await persistVisit(visit);
        const patient = patients.find((p) => p.id === visit.patientId);
        if (patient) await persistPatient(patient);
      }
    })();
  }

  return url;
}

export function setInbodySheetFile(visitId: string, file: File): string {
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
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `inbody/${visitId}/sheet-${Date.now()}.${ext}`;
    void (async () => {
      const uploaded = await uploadFile(path, file);
      if (!uploaded) {
        console.error('[upload] 인바디 스토리지 업로드 실패 — 영구 저장을 건너뜁니다.');
        return;
      }
      record.sheetImageUrl = uploaded.publicUrl;
      await persistInbody(record, uploaded.path);
      if (visit) await persistVisit(visit);
    })();
  }

  return url;
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

  void persistVisit(visit);
  imgs.forEach((img) => void persistVisitImage(img));
  if (inbody) void persistInbody(inbody);
  const patient = patients.find((p) => p.id === visit.patientId);
  if (patient) void persistPatient(patient);

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
  const patient = getPatientById(patientId)!;
  const visit = getLatestVisit(patientId)!;
  const frontImg = getVisitImages(visit.id, 'front');
  return {
    patient,
    visit,
    imageUrl: frontImg?.url ?? PLACEHOLDER_FRONT,
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

async function doInit(): Promise<void> {
  if (!isSupabaseEnabled) return;

  const loaded = await loadAllFromSupabase();
  if (loaded === null) {
    // DB가 비어있음(또는 로드 실패) → 현재 샘플 데이터를 그대로 시드
    await seedToSupabase({ patients, visits, visitImages, inbodyRecords });
  } else {
    replaceArray(patients, loaded.patients);
    replaceArray(visits, loaded.visits);
    replaceArray(visitImages, loaded.visitImages);
    replaceArray(inbodyRecords, loaded.inbodyRecords);
  }
  recalcTodayStats();
}

/** 앱 시작 시 1회 호출. 동시 호출 시 같은 로드 Promise를 공유한다. */
export function initData(): Promise<void> {
  if (!initPromise) initPromise = doInit();
  return initPromise;
}

recalcTodayStats();
