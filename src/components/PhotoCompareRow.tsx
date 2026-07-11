import RulerOverlay from './RulerOverlay';
import type { VisitImage } from '../types';

export interface PhotoSlot {
  label: string;
  labelColor: string;
  image?: VisitImage;
  date?: string;
}

interface PhotoCompareRowProps {
  title: string;
  slots: PhotoSlot[];
  grow?: boolean;
  metricsPosition?: 'above' | 'below' | 'none';
  /** 날짜 헤더 숨김 (통합 패널에서 1회만 표시할 때) */
  hideDateHeader?: boolean;
  /** 제목을 사진 왼쪽 세로로 배치 */
  sideLabel?: boolean;
}

const dotColorMap: Record<string, string> = {
  최초: 'bg-gray-500',
  이전: 'bg-blue-500',
  최신: 'bg-green-500',
};

const GRID_COLS = 'grid grid-cols-[44px_repeat(3,minmax(0,1fr))]';
const GRID_GAP = 'gap-x-0.5';

function MetricsTable({ slots }: { slots: PhotoSlot[] }) {
  return (
    <div className="border border-gray-200 rounded overflow-hidden text-sm flex-shrink-0">
      <div className={`${GRID_COLS} ${GRID_GAP}`}>
        <div className="bg-gray-50 px-1 py-1.5 text-[11px] text-gray-500 border-r border-b border-gray-200 flex items-center justify-center whitespace-nowrap">
          체중
        </div>
        {slots.map((slot, i) => (
          <div
            key={`w-${slot.label}`}
            className={`px-1 py-1.5 text-center border-b border-gray-200 whitespace-nowrap ${
              i < slots.length - 1 ? 'border-r' : ''
            }`}
          >
            {slot.image ? (
              <strong className="text-gray-900 text-xs">{slot.image.weightKg} kg</strong>
            ) : (
              <span className="text-gray-300">-</span>
            )}
          </div>
        ))}
      </div>
      <div className={`${GRID_COLS} ${GRID_GAP}`}>
        <div className="bg-gray-50 px-1 py-1.5 text-[11px] text-gray-500 border-r border-gray-200 flex items-center justify-center whitespace-nowrap">
          허리
        </div>
        {slots.map((slot, i) => (
          <div
            key={`h-${slot.label}`}
            className={`px-1 py-1.5 text-center whitespace-nowrap ${
              i < slots.length - 1 ? 'border-r border-gray-200' : ''
            }`}
          >
            {slot.image ? (
              <strong className="text-gray-900 text-xs">{slot.image.waistCm} cm</strong>
            ) : (
              <span className="text-gray-300">-</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotoGrid({
  title,
  slots,
  grow,
  sideLabel,
}: {
  title: string;
  slots: PhotoSlot[];
  grow?: boolean;
  sideLabel?: boolean;
}) {
  return (
    <div className={`${GRID_COLS} ${GRID_GAP} ${grow ? 'flex-1 min-h-0' : ''}`}>
      <div
        className={`flex items-center justify-center text-[11px] font-semibold text-gray-600 ${
          sideLabel ? 'pt-1 self-center' : ''
        }`}
      >
        {sideLabel ? (
          <span className="[writing-mode:vertical-rl] rotate-180 text-[12px] tracking-[0.2em]">
            {title}
          </span>
        ) : (
          <span className="text-center leading-tight">
            {title}
            <span className="block text-[9px] font-normal text-gray-400 mt-0.5">배꼽</span>
          </span>
        )}
      </div>
      {slots.map((slot) => (
        <div
          key={slot.label}
          className={`relative overflow-hidden bg-gray-100 ring-1 ring-gray-200 ${
            grow ? 'h-full min-h-[120px]' : 'aspect-[3/2]'
          }`}
        >
          {slot.image ? (
            <img src={slot.image.url} alt={`${title} ${slot.label}`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No Image</div>
          )}
          <RulerOverlay />
        </div>
      ))}
    </div>
  );
}

/** 정면+측면을 한 블록으로 — 사진끼리 붙이고 측면 라벨은 사진 옆 */
export function PhotoComparePair({
  frontSlots,
  sideSlots,
  grow = false,
}: {
  frontSlots: PhotoSlot[];
  sideSlots: PhotoSlot[];
  grow?: boolean;
}) {
  return (
    <div className={grow ? 'flex-1 flex flex-col min-h-0' : ''}>
      {/* 날짜 헤더 1회만 */}
      <div className={`${GRID_COLS} ${GRID_GAP} items-end mb-1 flex-shrink-0`}>
        <div className="text-[9px] text-gray-400 text-center leading-tight">단위
          <br />cm
        </div>
        {frontSlots.map((slot) => (
          <div key={slot.label} className="flex items-center justify-center gap-1 text-[11px]">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColorMap[slot.label] ?? 'bg-gray-400'}`} />
            <span className="text-gray-600 font-medium whitespace-nowrap">
              {slot.date ? slot.date.replace(/-/g, '.') : '-'}
            </span>
            <span className="text-gray-400">({slot.label})</span>
          </div>
        ))}
      </div>

      {/* 정면 수치 — 위 */}
      <div className="mb-1 flex-shrink-0">
        <MetricsTable slots={frontSlots} />
      </div>

      {/* 정면 사진 */}
      <div className={grow ? 'flex-[1.05] min-h-0' : ''}>
        <PhotoGrid title="정면" slots={frontSlots} grow={grow} />
      </div>

      {/* 측면 사진 — 바로 아래, 라벨은 왼쪽 */}
      <div className={`${grow ? 'flex-1 min-h-0' : ''} mt-0.5`}>
        <PhotoGrid title="측면" slots={sideSlots} grow={grow} sideLabel />
      </div>

      {/* 측면 수치 — 아래 */}
      <div className="mt-1 flex-shrink-0">
        <MetricsTable slots={sideSlots} />
      </div>
    </div>
  );
}

export default function PhotoCompareRow({
  title,
  slots,
  grow = false,
  metricsPosition = 'none',
  hideDateHeader = false,
  sideLabel = false,
}: PhotoCompareRowProps) {
  return (
    <div className={grow ? 'flex-1 flex flex-col min-h-0 mb-0' : 'mb-0'}>
      {!hideDateHeader && !sideLabel && (
        <div className={`${GRID_COLS} ${GRID_GAP} items-end mb-1 flex-shrink-0`}>
          <div />
          {slots.map((slot) => (
            <div key={slot.label} className="flex items-center justify-center gap-1 text-[11px]">
              <span className={`w-1.5 h-1.5 rounded-full ${dotColorMap[slot.label] ?? 'bg-gray-400'}`} />
              <span className="text-gray-600 font-medium whitespace-nowrap">
                {slot.date ? slot.date.replace(/-/g, '.') : '-'}
              </span>
              <span className="text-gray-400">({slot.label})</span>
            </div>
          ))}
        </div>
      )}

      {metricsPosition === 'above' && (
        <div className="mb-1">
          <MetricsTable slots={slots} />
        </div>
      )}

      <PhotoGrid title={title} slots={slots} grow={grow} sideLabel={sideLabel} />

      {metricsPosition === 'below' && (
        <div className="mt-1">
          <MetricsTable slots={slots} />
        </div>
      )}
    </div>
  );
}
