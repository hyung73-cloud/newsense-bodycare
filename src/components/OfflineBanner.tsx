import { RefreshCw, WifiOff } from 'lucide-react';
import { getOfflineCacheTime } from '../api/mock';

interface OfflineBannerProps {
  onRetry: () => void;
  retrying?: boolean;
}

export default function OfflineBanner({ onRetry, retrying }: OfflineBannerProps) {
  const savedAt = getOfflineCacheTime();
  const timeLabel = savedAt
    ? new Date(savedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3 text-sm text-amber-900">
      <div className="flex items-center gap-2 min-w-0">
        <WifiOff className="w-4 h-4 flex-shrink-0 text-amber-600" />
        <span className="truncate">
          서버 연결 안 됨 — 로컬 저장 데이터 사용 중
          {timeLabel && <span className="text-amber-700"> (저장: {timeLabel})</span>}
        </span>
      </div>
      <button
        type="button"
        disabled={retrying}
        onClick={onRetry}
        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold whitespace-nowrap disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
        {retrying ? '연결 중…' : '서버 다시 연결'}
      </button>
    </div>
  );
}
