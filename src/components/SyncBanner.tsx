import { useEffect, useState } from 'react';
import { Cloud, CloudOff, Loader2, AlertCircle } from 'lucide-react';
import { getSyncState, subscribeSync } from '../api/syncEngine';
import { isOfflineMode, hasPendingServerSync } from '../api/mock';

export default function SyncBanner() {
  const [sync, setSync] = useState(getSyncState);
  const offline = isOfflineMode();
  const pending = hasPendingServerSync();

  useEffect(() => subscribeSync(() => setSync(getSyncState())), []);

  if (sync.status === 'idle' && !offline && !pending) return null;

  if (offline || (pending && sync.status !== 'syncing' && sync.status !== 'error')) {
    return (
      <div className="border-b px-4 py-1.5 flex items-center gap-2 text-xs font-medium bg-amber-50 border-amber-200 text-amber-900">
        <CloudOff className="w-3.5 h-3.5" />
        <span className="truncate">
          {offline
            ? '오프라인 — 서버와 연결되지 않았습니다. 저장이 실패할 수 있습니다.'
            : '서버 미동기화 항목이 있습니다. 다시 저장해주세요.'}
        </span>
      </div>
    );
  }

  if (sync.status === 'idle') return null;

  const icon =
    sync.status === 'syncing' ? (
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
    ) : sync.status === 'error' ? (
      <AlertCircle className="w-3.5 h-3.5" />
    ) : (
      <Cloud className="w-3.5 h-3.5" />
    );

  const bg =
    sync.status === 'error'
      ? 'bg-red-50 border-red-200 text-red-800'
      : sync.status === 'syncing'
        ? 'bg-blue-50 border-blue-200 text-blue-800'
        : 'bg-green-50 border-green-200 text-green-800';

  const text =
    sync.status === 'syncing'
      ? `서버 저장 중… ${sync.label ?? ''}`
      : sync.status === 'error'
        ? `저장 실패: ${sync.error ?? '알 수 없음'}`
        : `서버 저장 완료 ${sync.label ? `(${sync.label})` : ''}`;

  return (
    <div className={`border-b px-4 py-1.5 flex items-center gap-2 text-xs font-medium ${bg}`}>
      {icon}
      <span className="truncate">{text}</span>
      {sync.status === 'error' && (
        <CloudOff className="w-3.5 h-3.5 ml-auto flex-shrink-0 opacity-60" />
      )}
    </div>
  );
}
