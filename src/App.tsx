import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import PatientProfilePage from './pages/PatientProfilePage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import PackageSelectPage from './pages/PackageSelectPage';
import { initData, hasDataLoadError, retryInitData, isOfflineMode, hasLocalDataCache, activateLocalCache } from './api/mock';
import { initAdmins } from './auth/adminAuth';
import { getLastLoadErrorMessage } from './api/supabaseData';
import { useAuth } from './context/AuthContext';
import OfflineBanner from './components/OfflineBanner';
import SyncBanner from './components/SyncBanner';

export default function App() {
  const { logout } = useAuth();
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [offline, setOffline] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('서버 연결 중…');

  const syncState = () => {
    setLoadError(hasDataLoadError());
    setOffline(isOfflineMode());
  };

  const runInit = async () => {
    setLoadingPhase('서버 연결 중…');
    await initData();
    await initAdmins();
    syncState();
  };

  useEffect(() => {
    let cancelled = false;
    const phaseTimer = setTimeout(() => {
      if (!cancelled) setLoadingPhase('사진·인바디 불러오는 중…');
    }, 3000);

    const hardCap = setTimeout(() => {
      if (!cancelled) {
        syncState();
        setReady(true);
      }
    }, 15000);

    runInit()
      .catch((err) => console.error('[init] 초기화 실패', err))
      .finally(() => {
        if (!cancelled) {
          clearTimeout(hardCap);
          clearTimeout(phaseTimer);
          syncState();
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
      clearTimeout(hardCap);
      clearTimeout(phaseTimer);
    };
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await Promise.all([retryInitData(), initAdmins()]);
      syncState();
      if (!hasDataLoadError()) setReady(true);
    } finally {
      setRetrying(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-gray-500">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">{loadingPhase}</p>
        <p className="text-xs text-gray-400 mt-2">서버에서 환자·사진·인바디 데이터를 불러오는 중입니다</p>
        <p className="text-xs text-gray-400 mt-1">무료 서버는 20~30초 걸릴 수 있습니다</p>
      </div>
    );
  }

  // 로드 실패 시: 편집을 막고 재시도 안내 (샘플 데이터로 작업해 실데이터가 덮어써지는 사고 방지)
  if (loadError) {
    const detail = getLastLoadErrorMessage();
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-center px-6">
        <div className="w-14 h-14 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4 text-2xl">!</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">데이터를 불러오지 못했습니다</h1>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          서버(Supabase) 응답이 느리거나 연결되지 않았습니다.
          <br />
          <strong>일시정지(Paused) 상태가 아닙니다.</strong> 무료 서버가 잠들어 있어 깨우는 데 시간이 걸릴 수 있습니다.
        </p>
        {detail && (
          <p className="text-xs text-gray-400 mb-4 max-w-md break-all bg-gray-50 px-3 py-2 rounded-lg">
            {detail}
          </p>
        )}
        <ul className="text-xs text-gray-500 text-left mb-6 space-y-1.5 max-w-sm">
          <li>1. Supabase 대시보드 → <strong>Settings → General → Restart project</strong></li>
          <li>2. 2분 기다린 후 아래 <strong>다시 시도</strong></li>
          {hasLocalDataCache() ? (
            <li>3. 또는 <strong>로컬 데이터로 계속</strong> (이전에 저장된 데이터)</li>
          ) : (
            <li>3. 이 브라우저에 저장된 데이터가 없어 서버 연결이 필요합니다</li>
          )}
        </ul>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={retrying}
            onClick={() => void handleRetry()}
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {retrying ? '연결 중…' : '다시 시도'}
          </button>
          {hasLocalDataCache() && (
            <button
              type="button"
              onClick={() => {
                if (activateLocalCache()) {
                  setLoadError(false);
                  setOffline(true);
                  setReady(true);
                }
              }}
              className="px-6 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600"
            >
              로컬 데이터로 계속
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {offline && <OfflineBanner onRetry={() => void handleRetry()} retrying={retrying} />}
      {!offline && <SyncBanner />}
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/patient/:id" element={<PatientProfilePage />} />
        <Route path="/settings/admins" element={<AdminSettingsPage />} />
        <Route path="/package" element={<PackageSelectPage />} />
        <Route path="/bodycare-package" element={<PackageSelectPage />} />
      </Routes>
    </>
  );
}
