import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import PatientProfilePage from './pages/PatientProfilePage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import PackageSelectPage from './pages/PackageSelectPage';
import { initData } from './api/mock';

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
