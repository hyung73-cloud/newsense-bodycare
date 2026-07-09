/** 서버 동기화 상태 (UI 표시용). */
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface SyncState {
  status: SyncStatus;
  label: string | null;
  error: string | null;
  syncedAt: string | null;
}

let state: SyncState = {
  status: 'idle',
  label: null,
  error: null,
  syncedAt: null,
};

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

export function getSyncState(): SyncState {
  return { ...state };
}

export function subscribeSync(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function formatErr(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

/** 서버 저장 작업 실행. 실패 시 error 상태로 전환하고 예외를 다시 던진다. */
export async function runServerCommit(label: string, fn: () => Promise<void>): Promise<void> {
  state = { ...state, status: 'syncing', label, error: null };
  notify();
  try {
    await fn();
    state = {
      status: 'synced',
      label,
      error: null,
      syncedAt: new Date().toISOString(),
    };
    notify();
  } catch (err) {
    const msg = formatErr(err);
    state = { status: 'error', label, error: msg, syncedAt: state.syncedAt };
    notify();
    throw err;
  }
}

/** 로컬만 갱신(서버 미사용) 시 synced 표시. */
export function markLocalSynced(label: string): void {
  state = {
    status: 'synced',
    label,
    error: null,
    syncedAt: new Date().toISOString(),
  };
  notify();
}
