import { Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import PatientProfilePage from './pages/PatientProfilePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/patient/:id" element={<PatientProfilePage />} />
    </Routes>
  );
}
