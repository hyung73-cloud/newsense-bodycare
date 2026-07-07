import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import PatientProfilePage from './pages/PatientProfilePage';
import PinLoginGate from './components/PinLoginGate';
import { setStaffName } from './api/mock';

const AUTH_KEY = 'bodycare-auth-v1';
const STAFF_KEY = 'bodycare-staff-name-v1';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const savedAuth = localStorage.getItem(AUTH_KEY) === '1';
    const savedStaff = localStorage.getItem(STAFF_KEY);
    if (savedStaff) setStaffName(savedStaff);
    setAuthenticated(savedAuth);
  }, []);

  const handleLogin = (adminName: string) => {
    setStaffName(adminName);
    localStorage.setItem(STAFF_KEY, adminName);
    localStorage.setItem(AUTH_KEY, '1');
    setAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setAuthenticated(false);
  };

  if (!authenticated) {
    return <PinLoginGate onLogin={handleLogin} />;
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardPage onLogout={handleLogout} />} />
      <Route path="/patient/:id" element={<PatientProfilePage onLogout={handleLogout} />} />
    </Routes>
  );
}
