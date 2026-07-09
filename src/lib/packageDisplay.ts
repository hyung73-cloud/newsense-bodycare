import type { Visit } from '../types';

/** 기존 데이터(이름만 저장) 호환용 */
const LEGACY_PACKAGES: Record<string, { price: number; items: string }> = {
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

  if (visit.packageDetail || visit.packagePrice != null) {
    return {
      title,
      items: visit.packageDetail?.trim() ?? '',
      price: visit.packagePrice ?? 0,
    };
  }

  const legacy = LEGACY_PACKAGES[title];
  if (legacy) {
    return { title, items: legacy.items, price: legacy.price };
  }

  return { title, items: '', price: 0 };
}
