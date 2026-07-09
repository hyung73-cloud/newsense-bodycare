/** 한국 공휴일 (고정일 + 연도별 음력·대체공휴일) */

const FIXED: ReadonlyArray<readonly [month: number, day: number]> = [
  [1, 1],   // 신정
  [3, 1],   // 삼일절
  [5, 5],   // 어린이날
  [6, 6],   // 현충일
  [7, 17],  // 제헌절
  [8, 15],  // 광복절
  [10, 3],  // 개천절
  [10, 9],  // 한글날
  [12, 25], // 성탄절
];

/** 음력·대체공휴일 (YYYY-MM-DD) */
const EXTRA_BY_YEAR: Record<number, readonly string[]> = {
  2024: [
    '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12', // 설날·대체
    '2024-05-15', // 석가탄신일
    '2024-09-16', '2024-09-17', '2024-09-18', // 추석
  ],
  2025: [
    '2025-01-28', '2025-01-29', '2025-01-30', // 설날
    '2025-03-03', // 삼일절 대체 (3/1 토)
    '2025-05-05', // 석가탄신일
    '2025-05-06', // 어린이날 대체 (5/5 월+연휴)
    '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08', // 추석·대체
  ],
  2026: [
    '2026-02-16', '2026-02-17', '2026-02-18', // 설날
    '2026-03-02', // 삼일절 대체 (3/1 일)
    '2026-05-24', '2026-05-25', // 석가탄신일·대체
    '2026-09-24', '2026-09-25', '2026-09-26', // 추석
  ],
  2027: [
    '2027-02-06', '2027-02-07', '2027-02-08', // 설날
    '2027-05-13', // 석가탄신일
    '2027-09-14', '2027-09-15', '2027-09-16', // 추석
  ],
  2028: [
    '2028-01-26', '2028-01-27', '2028-01-28', // 설날
    '2028-05-02', // 석가탄신일
    '2028-10-02', '2028-10-03', '2028-10-04', // 추석
  ],
};

const cache = new Map<number, Set<string>>();

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function buildHolidaySet(year: number): Set<string> {
  const cached = cache.get(year);
  if (cached) return cached;

  const set = new Set<string>();
  for (const [month, day] of FIXED) {
    set.add(toKey(year, month, day));
  }
  for (const key of EXTRA_BY_YEAR[year] ?? []) {
    set.add(key);
  }

  cache.set(year, set);
  return set;
}

export function isKoreanPublicHoliday(year: number, month: number, day: number): boolean {
  return buildHolidaySet(year).has(toKey(year, month, day));
}

/** 일요일·토요일·공휴일 → 빨간색 표시 */
export function isRedCalendarDay(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month - 1, day).getDay();
  if (dow === 0 || dow === 6) return true;
  return isKoreanPublicHoliday(year, month, day);
}

export function isRedWeekdayHeader(index: number): boolean {
  return index === 0 || index === 6;
}
