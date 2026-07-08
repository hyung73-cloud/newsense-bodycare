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
}

const dotColorMap: Record<string, string> = {
  최초: 'bg-gray-500',
  이전: 'bg-blue-500',
  최신: 'bg-green-500',
};

const GRID_COLS = 'grid grid-cols-[64px_repeat(3,minmax(0,1fr))]';

export default function PhotoCompareRow({ title, slots, grow = false }: PhotoCompareRowProps) {
  return (
    <div className={grow ? 'flex-1 flex flex-col min-h-0 mb-6 last:mb-0' : 'mb-6'}>
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-700 tracking-tight">{title}</span>
        <span className="text-[10px] text-gray-400">단위 : cm</span>
      </div>

      {/* 날짜 헤더 */}
      <div className={`${GRID_COLS} gap-x-4 items-end mb-2 flex-shrink-0`}>
        <div />
        {slots.map((slot) => (
          <div key={slot.label} className="flex items-center justify-center gap-1.5 text-xs">
            <span className={`w-2 h-2 rounded-full ${dotColorMap[slot.label] ?? 'bg-gray-400'}`} />
            <span className="text-gray-600 font-medium">
              {slot.date ? slot.date.replace(/-/g, '.') : '-'}
            </span>
            <span className="text-gray-400">({slot.label})</span>
          </div>
        ))}
      </div>

      {/* 사진 */}
      <div className={`${GRID_COLS} gap-x-4 ${grow ? 'flex-1 min-h-0' : ''}`}>
        <div className="flex items-center justify-center text-[10px] text-gray-400 leading-tight text-center">
          (배꼽
          <br />
          중심)
        </div>
        {slots.map((slot) => (
          <div
            key={slot.label}
            className={`relative rounded-lg overflow-hidden bg-gray-100 ring-1 ring-gray-200 shadow-sm ${
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

      {/* 체중 / 허리둘레 표 */}
      <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden text-sm flex-shrink-0">
        <div className={GRID_COLS}>
          <div className="bg-gray-50 px-2 py-2 text-xs text-gray-500 border-r border-b border-gray-200 flex items-center">
            체중
          </div>
          {slots.map((slot, i) => (
            <div
              key={slot.label}
              className={`px-2 py-2 text-center border-b border-gray-200 ${i < slots.length - 1 ? 'border-r' : ''}`}
            >
              {slot.image ? (
                <strong className="text-gray-900">{slot.image.weightKg} kg</strong>
              ) : (
                <span className="text-gray-300">-</span>
              )}
            </div>
          ))}
        </div>
        <div className={GRID_COLS}>
          <div className="bg-gray-50 px-2 py-2 text-xs text-gray-500 border-r border-gray-200 flex items-center">
            허리둘레
          </div>
          {slots.map((slot, i) => (
            <div
              key={slot.label}
              className={`px-2 py-2 text-center ${i < slots.length - 1 ? 'border-r border-gray-200' : ''}`}
            >
              {slot.image ? (
                <strong className="text-gray-900">{slot.image.waistCm} cm</strong>
              ) : (
                <span className="text-gray-300">-</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
