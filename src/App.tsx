import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import PatientProfilePage from './pages/PatientProfilePage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import PackageSelectPage from './pages/PackageSelectPage';
import { initData, hasDataLoadError, retryInitData } from './api/mock';
import { initAdmins } from './auth/adminAuth';
import { getLastLoadErrorMessage } from './api/supabaseData';

export default function App() {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const runInit = async () => {
    await initData();
    void initAdmins(); // 관리자 목록은 백그라운드 로드 (앱 표시를 막지 않음)
    setLoadError(hasDataLoadError());
  };

  useEffect(() => {
    let cancelled = false;
    const hardCap = setTimeout(() => {
      if (!cancelled) {
        setLoadError(hasDataLoadError());
        setReady(true);
      }
    }, 5000);

    runInit()
      .catch((err) => console.error('[init] 초기화 실패', err))
      .finally(() => {
        if (!cancelled) {
          clearTimeout(hardCap);
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
      clearTimeout(hardCap);
    };
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await Promise.all([retryInitData(), initAdmins()]);
      const failed = hasDataLoadError();
      setLoadError(failed);
      if (!failed) setReady(true);
    } finally {
      setRetrying(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-gray-500">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">데이터를 불러오는 중…</p>
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
          서버(Supabase)에서 환자 데이터를 읽지 못했습니다.
          <br />
          데이터 보호를 위해 작업을 잠시 중단했습니다.
        </p>
        {detail && (
          <p className="text-xs text-gray-400 mb-4 max-w-md break-all bg-gray-50 px-3 py-2 rounded-lg">
            {detail}
          </p>
        )}
        <ul className="text-xs text-gray-500 text-left mb-6 space-y-1 max-w-sm">
          <li>1. Supabase 대시보드에서 프로젝트가 <strong>일시정지(Paused)</strong> 상태인지 확인</li>
          <li>2. 일시정지면 <strong>Restore project</strong> 클릭 후 1~2분 대기</li>
          <li>3. 아래 <strong>다시 시도</strong> 버튼 클릭</li>
        </ul>
        <button
          type="button"
          disabled={retrying}
          onClick={() => void handleRetry()}
          className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
        >
          {retrying ? '연결 중…' : '다시 시도'}
        </button>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/patient/:id" element={<PatientProfilePage />} />
      <Route path="/settings/admins" element={<AdminSettingsPage />} />
      <Route path="/package" element={<PackageSelectPage />} />
      <Route path="/bodycare-package" element={<PackageSelectPage />} />
    </Routes>
  );
}
