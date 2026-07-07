export type Sex = '여' | '남';
export type VisitStatus = '완료' | '진행중' | '미완료';
export type ImageType = 'front' | 'side';

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
