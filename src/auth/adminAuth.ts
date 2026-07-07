export interface AdminAccount {
  id: string;
  name: string;
  pin: string;
}

export const adminAccounts: AdminAccount[] = [
  { id: 'admin-1', name: '김실장', pin: '327288' },
  // TODO: 관리자 정보 확정 시 아래 형식으로 5명 추가
  // { id: 'admin-2', name: '홍길동', pin: '123456' },
];

export function getAdminNames(): string[] {
  return adminAccounts.map((a) => a.name);
}

export function verifyAdminPin(name: string, pin: string): boolean {
  const matched = adminAccounts.find((a) => a.name === name.trim());
  if (!matched) return false;
  return matched.pin === pin;
}
