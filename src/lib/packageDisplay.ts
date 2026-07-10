import type { PackageTicketLine, Visit } from '../types';

/** 기존 데이터(이름만 저장) 호환용 */
const LEGACY_PACKAGES: Record<string, { price: number; items: string }> = {
  '2회진료권 · 체중관리': {
    price: 25000,
    items: '인바디, 맞춤처방, 생활습관 가이드, 씨앤유 처방',
  },
  '5회진료권 · 건강관리': {
    price: 65000,
    items: '2회진료권 전체 포함, 허리둘레 측정, 체형사진, 당화혈색소 검사',
  },
  '10회진료권 · 체형관리': {
    price: 100000,
    items: '5회진료권 전체 포함, 카복시 관리, 체형기록, 변화 리포트',
  },
  'Basic · 체중관리': {
    price: 29000,
    items: '인바디, 맞춤처방, 생활습관 가이드, 씨앤유 처방',
  },
  'Standard · 건강관리': {
    price: 49000,
    items: 'Basic 전체 포함, 허리둘레 측정, 체형사진, 당화혈색소 검사',
  },
  'Premium · 체형관리': {
    price: 69000,
    items: 'Standard 전체 포함, 카복시 관리, 체형기록, 변화 리포트',
  },
};

export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

export function getPackageDisplay(visit: Pick<Visit, 'packageName' | 'packageDetail' | 'packagePrice'>) {
  const title = visit.packageName?.trim() ?? '';
  if (!title) return null;

  const legacy = LEGACY_PACKAGES[title];
  const items = visit.packageDetail?.trim() || legacy?.items || '';
  const storedPrice = visit.packagePrice;

  const price =
    storedPrice != null && storedPrice > 0
      ? storedPrice
      : legacy?.price ?? (storedPrice ?? 0);

  return { title, items, price };
}

/** 영수증 모달용 티켓 목록 (저장된 JSON 우선, 없으면 기존 필드로 복원) */
export function getPackageTickets(
  visit: Pick<Visit, 'packageName' | 'packageDetail' | 'packagePrice' | 'packageTickets'>,
): PackageTicketLine[] {
  if (visit.packageTickets?.length) {
    return visit.packageTickets.map((t) => ({ ...t }));
  }

  const display = getPackageDisplay(visit);
  if (!display) return [];

  const parts = display.items
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    return parts.map((label) => ({ label, sub: '포함 항목', price: 0 }));
  }

  return [
    {
      label: display.title,
      sub: display.items || undefined,
      price: display.price,
    },
  ];
}

export function sumTicketPrices(tickets: PackageTicketLine[]): number {
  return tickets.reduce((sum, t) => sum + (Number.isFinite(t.price) ? t.price : 0), 0);
}
