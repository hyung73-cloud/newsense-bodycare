import { X } from 'lucide-react';

interface ImageZoomModalProps {
  url: string;
  onClose: () => void;
}

export default function ImageZoomModal({ url, onClose }: ImageZoomModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="relative max-w-2xl max-h-[90vh] bg-white rounded-card p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50"
        >
          <X className="w-4 h-4" />
        </button>
        <img src={url} alt="확대" className="max-w-full max-h-[80vh] rounded-lg object-contain" />
      </div>
    </div>
  );
}
