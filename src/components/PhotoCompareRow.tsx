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
    <div className="mb-7">
      <div className="text-sm font-semibold text-gray-700 mb-3 tracking-tight">{title}</div>
      <div className="grid grid-cols-3 gap-5">
        {slots.map((slot) => (
          <div key={slot.label} className="flex flex-col items-center">
            <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-[3/4] w-full max-w-[190px] ring-1 ring-gray-200 shadow-sm">
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
                className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm ${slot.labelColor}`}
              >
                {slot.label}
              </div>
            </div>

            <div className="w-full max-w-[190px] mt-2 text-center">
              {slot.date && (
                <div className="text-xs text-gray-400">{slot.date.replace(/-/g, '.')}</div>
              )}
              {slot.image && (
                <div className="mt-1.5 grid grid-cols-2 gap-1 text-xs">
                  <div className="rounded-md bg-gray-50 border border-gray-200 py-1">
                    <span className="text-gray-500">체중 </span>
                    <strong className="text-gray-900">{slot.image.weightKg}kg</strong>
                  </div>
                  <div className="rounded-md bg-gray-50 border border-gray-200 py-1">
                    <span className="text-gray-500">허리 </span>
                    <strong className="text-gray-900">{slot.image.waistCm}cm</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
