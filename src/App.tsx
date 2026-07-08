import { Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import PatientProfilePage from './pages/PatientProfilePage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import PackageSelectPage from './pages/PackageSelectPage';

export default function App() {
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
