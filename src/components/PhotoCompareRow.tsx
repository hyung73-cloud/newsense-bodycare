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
}

export default function PhotoCompareRow({ title, slots }: PhotoCompareRowProps) {
  return (
    <div className="mb-6">
      <div className="text-sm font-medium text-gray-700 mb-3">{title}</div>
      <div className="grid grid-cols-3 gap-4">
        {slots.map((slot) => (
          <div key={slot.label} className="text-center">
            <div
              className="relative rounded-lg overflow-hidden bg-gray-100 aspect-[3/4] mx-auto max-w-[180px]"
            >
              {slot.image ? (
                <img
                  src={slot.image.url}
                  alt={slot.label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                  No Image
                </div>
              )}
              <RulerOverlay />
              <div
                className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded ${slot.labelColor}`}
              >
                {slot.label}
              </div>
            </div>
            {slot.date && (
              <div className="text-xs text-gray-400 mt-1.5">{slot.date.replace(/-/g, '.')}</div>
            )}
            {slot.image && (
              <div className="flex justify-center gap-4 mt-1 text-xs">
                <span>
                  체중 <strong className="text-gray-900">{slot.image.weightKg}kg</strong>
                </span>
                <span>
                  허리 <strong className="text-gray-900">{slot.image.waistCm}cm</strong>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
