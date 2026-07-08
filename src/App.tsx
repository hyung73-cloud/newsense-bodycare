import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import PatientProfilePage from './pages/PatientProfilePage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import PackageSelectPage from './pages/PackageSelectPage';
import { initData, hasDataLoadError } from './api/mock';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    initData()
      .catch((err) => console.error('[init] 데이터 초기화 실패', err))
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-gray-500">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">데이터를 불러오는 중…</p>
      </div>
    );
  }

  // 로드 실패 시: 편집을 막고 재시도 안내 (샘플 데이터로 작업해 실데이터가 덮어써지는 사고 방지)
  if (hasDataLoadError()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-center px-6">
        <div className="w-14 h-14 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4 text-2xl">!</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">데이터를 불러오지 못했습니다</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          서버(Supabase) 연결이 일시적으로 불안정합니다.
          <br />
          데이터 보호를 위해 작업을 잠시 중단했습니다. 잠시 후 다시 시도해주세요.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-700"
        >
          다시 시도
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
