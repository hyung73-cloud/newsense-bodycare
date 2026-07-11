export type Sex = '여' | '남';
export type VisitStatus = '완료' | '진행중' | '미완료';
export type ImageType = 'front' | 'side' | 'front_prev' | 'side_prev' | 'front_first' | 'side_first';

/** 패키지(시술권) 영수증 한 줄 */
export interface PackageTicketLine {
  label: string;
  sub?: string;
  price: number;
}

export interface Patient {
  id: string;
  chartNo: string;
  name: string;
  sex: Sex;
  birth: string;
  ageAtToday: number;
  heightCm: number;
  startDate: string;
  totalVisits: number;
  lastVisitDate: string;
  phone?: string;
}

export interface Visit {
  id: string;
  patientId: string;
  date: string;
  weightKg: number;
  waistCm: number;
  bodyFatPct: number;
  skeletalMuscleKg: number;
  visceralLevel: number;
  doctorNote: string;
  photoUploaded: boolean;
  inbodyUploaded: boolean;
  status: VisitStatus;
  enteredBy: string;
  enteredAt: string;
  hidden: boolean;
  packageName?: string;
  packageDetail?: string;
  packagePrice?: number;
  packageTickets?: PackageTicketLine[];
}

export interface VisitImage {
  id: string;
  visitId: string;
  type: ImageType;
  url: string;
  weightKg: number;
  waistCm: number;
}

export interface InbodyRecord {
  visitId: string;
  weightKg: number;
  skeletalMuscleKg: number;
  bodyFatPct: number;
  visceralLevel: number;
  bmrKcal: number;
  abdominalFatRatio: number;
  smi: number;
  sheetImageUrl: string;
}

/** 체형결과지 — 복부 바깥둘레·안쪽둘레·지방두께 */
export interface BodyShapeRecord {
  visitId: string;
  outerCircumferenceCm: number;
  innerCircumferenceCm: number;
  fatThicknessMm: number;
  noteText: string;
  sheetImageUrl: string;
}

export interface ProcedureTag {
  key: string;
  label: string;
  count: number;
  patientIds: string[];
}

export interface TodayStats {
  date: string;
  totalVisits: number;
  newPatients: number;
  photoUploaded: number;
  inbodyUploaded: number;
  incomplete: number;
}

export interface ProgressStats {
  total: number;
  completed: number;
  inProgress: number;
  incomplete: number;
}

export interface CalendarDay {
  date: string;
  visitCount: number;
  newCount: number;
  returningCount: number;
}

export interface RecentMemo {
  id: string;
  date: string;
  patientName: string;
  patientId: string;
  summary: string;
}

export interface StaffInfo {
  name: string;
}
