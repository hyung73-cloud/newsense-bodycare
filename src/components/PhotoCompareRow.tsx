import RulerOverlay from './RulerOverlay';
import type { VisitImage } from '../types';

interface PhotoSlot {
  label: string;
  labelColor: string;
  image?: VisitImage;
  date?: string;
}

interface PhotoCompareRowProps {
  title: string;
  slots: PhotoSlot[];
  grow?: boolean;
  /** 체중·허리둘레 표 표시 (정면만 true 권장) */
  showMetrics?: boolean;
}

const dotColorMap: Record<string, string> = {
  최초: 'bg-gray-500',
  이전: 'bg-blue-500',
  최신: 'bg-green-500',
};

/** 사진이 최대한 붙도록 간격 최소화 */
const GRID_COLS = 'grid grid-cols-[52px_repeat(3,minmax(0,1fr))]';
const GRID_GAP = 'gap-x-1';

export default function PhotoCompareRow({
  title,
  slots,
  grow = false,
  showMetrics = false,
}: PhotoCompareRowProps) {
  return (
    <div className={grow ? 'flex-1 flex flex-col min-h-0 mb-3 last:mb-0' : 'mb-3'}>
      <div className="flex items-center gap-2 mb-1.5 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-700 tracking-tight">{title}</span>
        <span className="text-[10px] text-gray-400">단위 : cm</span>
      </div>

      {/* 날짜 헤더 */}
      <div className={`${GRID_COLS} ${GRID_GAP} items-end mb-1 flex-shrink-0`}>
        <div />
        {slots.map((slot) => (
          <div key={slot.label} className="flex items-center justify-center gap-1 text-[11px]">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColorMap[slot.label] ?? 'bg-gray-400'}`} />
            <span className="text-gray-600 font-medium">
              {slot.date ? slot.date.replace(/-/g, '.') : '-'}
            </span>
            <span className="text-gray-400">({slot.label})</span>
          </div>
        ))}
      </div>

      {/* 체중 / 허리둘레 표 — 사진 위 */}
      {showMetrics && (
        <div className="mb-1.5 border border-gray-200 rounded-md overflow-hidden text-sm flex-shrink-0">
          <div className={`${GRID_COLS} ${GRID_GAP}`}>
            <div className="bg-gray-50 px-1.5 py-1.5 text-[11px] text-gray-500 border-r border-b border-gray-200 flex items-center">
              체중
            </div>
            {slots.map((slot, i) => (
              <div
                key={slot.label}
                className={`px-1 py-1.5 text-center border-b border-gray-200 ${i < slots.length - 1 ? 'border-r' : ''}`}
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
            <div className="bg-gray-50 px-1.5 py-1.5 text-[11px] text-gray-500 border-r border-gray-200 flex items-center">
              허리둘레
            </div>
            {slots.map((slot, i) => (
              <div
                key={slot.label}
                className={`px-1 py-1.5 text-center ${i < slots.length - 1 ? 'border-r border-gray-200' : ''}`}
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
      )}

      {/* 사진 — 간격 최소화 */}
      <div className={`${GRID_COLS} ${GRID_GAP} ${grow ? 'flex-1 min-h-0' : ''}`}>
        <div className="flex items-center justify-center text-[10px] text-gray-400 leading-tight text-center">
          (배꼽
          <br />
          중심)
        </div>
        {slots.map((slot) => (
          <div
            key={slot.label}
            className={`relative overflow-hidden bg-gray-100 ring-1 ring-gray-200 ${
              grow ? 'h-full min-h-[130px]' : 'aspect-[3/2]'
            }`}
          >
            {slot.image ? (
              <img src={slot.image.url} alt={slot.label} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                No Image
              </div>
            )}
            <RulerOverlay />
          </div>
        ))}
      </div>
    </div>
  );
}
