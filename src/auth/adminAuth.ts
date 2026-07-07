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

export function getAdminAccounts(): AdminAccount[] {
  return readStorage() ?? DEFAULT_ADMIN_ACCOUNTS.map((a) => ({ ...a }));
}

export function saveAdminAccounts(accounts: AdminAccount[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
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
