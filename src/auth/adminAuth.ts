import { isSupabaseEnabled } from '../lib/supabase';
import { loadAdmins, persistAdmins } from '../api/supabaseData';

export interface AdminAccount {
  id: string;
  name: string;
  pin: string;
}

const STORAGE_KEY = 'bodycare-admins-v1';

export const DEFAULT_ADMIN_ACCOUNTS: AdminAccount[] = [
  { id: 'admin-1', name: '김민수', pin: '327288' },
  { id: 'admin-2', name: '이서연', pin: '327288' },
  { id: 'admin-3', name: '박지훈', pin: '327288' },
  { id: 'admin-4', name: '최유진', pin: '327288' },
  { id: 'admin-5', name: '정하늘', pin: '327288' },
  { id: 'admin-6', name: '한도윤', pin: '327288' },
];

/** 서버에서 로드한 최신 목록을 담는 메모리 캐시 (동기 API가 즉시 참조). */
let cache: AdminAccount[] | null = null;

function readStorage(): AdminAccount[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminAccount[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** 캐시 + localStorage 를 동시에 갱신 (즉시 반영, 오프라인/새로고침 대비). */
function applyLocal(accounts: AdminAccount[]): void {
  cache = accounts.map((a) => ({ ...a }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function getAdminAccounts(): AdminAccount[] {
  if (cache) return cache.map((a) => ({ ...a }));
  const stored = readStorage();
  if (stored) {
    cache = stored;
    return stored.map((a) => ({ ...a }));
  }
  return DEFAULT_ADMIN_ACCOUNTS.map((a) => ({ ...a }));
}

/** 저장: 즉시 로컬 반영 후 서버(Supabase)에 영구 저장. 모든 기기가 공유. */
export function saveAdminAccounts(accounts: AdminAccount[]): void {
  applyLocal(accounts);
  if (isSupabaseEnabled) void persistAdmins(accounts);
}

/**
 * 앱 시작 시 1회 호출. 서버에서 공유 관리자 목록을 불러온다.
 * - 서버에 데이터가 있으면 그것을 사용(모든 기기 동일).
 * - 서버가 비어있으면 현재 로컬/기본값으로 시드.
 * - 로드 실패면 로컬값을 유지하고 아무것도 덮어쓰지 않는다.
 */
export async function initAdmins(): Promise<void> {
  if (!isSupabaseEnabled) return;
  const remote = await loadAdmins();
  if (remote === null) return; // 로드 실패 → 로컬 유지
  if (remote.length === 0) {
    const seed = readStorage() ?? DEFAULT_ADMIN_ACCOUNTS.map((a) => ({ ...a }));
    applyLocal(seed);
    await persistAdmins(seed);
    return;
  }
  applyLocal(remote);
}

export function getAdminNames(): string[] {
  return getAdminAccounts().map((a) => a.name);
}

export function getDefaultAdminName(): string {
  return getAdminAccounts()[0]?.name ?? '김민수';
}

export function verifyAdminPin(name: string, pin: string): boolean {
  const matched = getAdminAccounts().find((a) => a.name === name.trim());
  if (!matched) return false;
  return matched.pin === pin;
}

/** 관리자 설정 페이지·버튼 접근 권한 (목록 1번 계정만) */
export function canAccessAdminSettings(staffName: string): boolean {
  const chief = getAdminAccounts()[0];
  if (!chief) return false;
  return chief.name.trim() === staffName.trim();
}

export function validateAdminAccounts(accounts: AdminAccount[]): string | null {
  if (accounts.length !== 6) return '관리자는 6명이어야 합니다.';
  const names = new Set<string>();
  for (const account of accounts) {
    const name = account.name.trim();
    if (!name) return '관리자명을 모두 입력해주세요.';
    if (names.has(name)) return '관리자명은 중복될 수 없습니다.';
    names.add(name);
    if (!/^\d{6}$/.test(account.pin)) return 'PIN은 6자리 숫자여야 합니다.';
  }
  return null;
}

export function resetAdminAccountsToDefault(): void {
  localStorage.removeItem(STORAGE_KEY);
}
