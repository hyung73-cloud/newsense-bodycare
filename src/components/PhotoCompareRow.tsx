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
  hideDateHeader?: boolean;
  sideLabel?: boolean;
}

const dotColorMap: Record<string, string> = {
  그전: 'bg-blue-500',
  오늘: 'bg-green-500',
  최근: 'bg-green-500',
};

const GRID_COLS_2 = 'grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)]';
const GRID_COLS_3 = 'grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]';

function gridCols(count: number) {
  return count <= 2 ? GRID_COLS_2 : GRID_COLS_3;
}

function MetricsTable({ slots }: { slots: PhotoSlot[] }) {
  const cols = gridCols(slots.length);
  return (
    <div className="border border-gray-200 overflow-hidden text-sm">
      <div className={`${cols} gap-x-0`}>
        <div className="bg-gray-50 px-1 py-1 text-[11px] text-gray-500 border-r border-b border-gray-200 flex items-center justify-center whitespace-nowrap">
          체중
        </div>
        {slots.map((slot, i) => (
          <div
            key={`w-${slot.label}`}
            className={`px-1 py-1 text-center border-b border-gray-200 whitespace-nowrap ${
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
      <div className={`${cols} gap-x-0`}>
        <div className="bg-gray-50 px-1 py-1 text-[11px] text-gray-500 border-r border-gray-200 flex items-center justify-center whitespace-nowrap">
          허리
        </div>
        {slots.map((slot, i) => (
          <div
            key={`h-${slot.label}`}
            className={`px-1 py-1 text-center whitespace-nowrap ${
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
  sideLabel,
}: {
  title: string;
  slots: PhotoSlot[];
  sideLabel?: boolean;
}) {
  const cols = gridCols(slots.length);
  return (
    <div className={`${cols} gap-x-0`}>
      <div className="flex items-center justify-center text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 border-r-0">
        {sideLabel ? (
          <span className="[writing-mode:vertical-rl] rotate-180 text-[12px] tracking-[0.15em] py-2">
            {title}
          </span>
        ) : (
          <span className="text-center leading-tight px-0.5">
            {title}
            <span className="block text-[9px] font-normal text-gray-400 mt-0.5">배꼽</span>
          </span>
        )}
      </div>
      {slots.map((slot, i) => (
        <div
          key={slot.label}
          className={`relative aspect-[3/2] overflow-hidden bg-gray-100 border border-gray-200 ${
            i === 0 ? 'border-l-0' : ''
          } ${i > 0 ? '-ml-px' : ''}`}
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

/** 정면+측면 — 간격 없이 밀착 */
export function PhotoComparePair({
  frontSlots,
  sideSlots,
}: {
  frontSlots: PhotoSlot[];
  sideSlots: PhotoSlot[];
  grow?: boolean;
}) {
  const cols = gridCols(frontSlots.length);
  return (
    <div className="flex flex-col">
      <div className={`${cols} gap-x-0 items-end mb-0`}>
        <div className="text-[9px] text-gray-400 text-center leading-tight pb-1">
          단위
          <br />
          cm
        </div>
        {frontSlots.map((slot) => (
          <div key={slot.label} className="flex items-center justify-center gap-1 text-[11px] pb-1">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColorMap[slot.label] ?? 'bg-gray-400'}`} />
            <span className="text-gray-600 font-medium whitespace-nowrap">
              {slot.date ? slot.date.replace(/-/g, '.') : '-'}
            </span>
            <span className="text-gray-400">({slot.label})</span>
          </div>
        ))}
      </div>

      <MetricsTable slots={frontSlots} />
      <div className="-mt-px">
        <PhotoGrid title="정면" slots={frontSlots} />
      </div>
      <div className="-mt-px">
        <PhotoGrid title="측면" slots={sideSlots} sideLabel />
      </div>
      <div className="-mt-px">
        <MetricsTable slots={sideSlots} />
      </div>
    </div>
  );
}

export default function PhotoCompareRow({
  title,
  slots,
  metricsPosition = 'none',
  hideDateHeader = false,
  sideLabel = false,
}: PhotoCompareRowProps) {
  const cols = gridCols(slots.length);
  return (
    <div>
      {!hideDateHeader && !sideLabel && (
        <div className={`${cols} gap-x-0 items-end mb-0`}>
          <div />
          {slots.map((slot) => (
            <div key={slot.label} className="flex items-center justify-center gap-1 text-[11px] pb-1">
              <span className={`w-1.5 h-1.5 rounded-full ${dotColorMap[slot.label] ?? 'bg-gray-400'}`} />
              <span className="text-gray-600 font-medium whitespace-nowrap">
                {slot.date ? slot.date.replace(/-/g, '.') : '-'}
              </span>
              <span className="text-gray-400">({slot.label})</span>
            </div>
          ))}
        </div>
      )}

      {metricsPosition === 'above' && <MetricsTable slots={slots} />}
      <div className={metricsPosition === 'above' ? '-mt-px' : ''}>
        <PhotoGrid title={title} slots={slots} sideLabel={sideLabel} />
      </div>
      {metricsPosition === 'below' && (
        <div className="-mt-px">
          <MetricsTable slots={slots} />
        </div>
      )}
    </div>
  );
}
