import { Link, useLocation } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { getStaff } from '../api/mock';
import { useAuth } from '../context/AuthContext';
import QuickSearch from './QuickSearch';

const tabs = [
  { label: '대시보드', path: '/', key: 'dashboard' },
  { label: '환자검색', path: '#', key: 'search' },
  { label: '오늘입력', path: '#', key: 'today' },
  { label: '환자관리', path: '#', key: 'manage', activeOnPatient: true },
];

interface TopNavProps {
  activeTab?: 'dashboard' | 'search' | 'today' | 'manage';
}

export default function TopNav({ activeTab }: TopNavProps) {
  const location = useLocation();
  const { logout } = useAuth();
  const staff = getStaff();
  const isPatientPage = location.pathname.startsWith('/patient/');
  const resolvedTab = activeTab ?? (isPatientPage ? 'manage' : 'dashboard');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center gap-6">
        <div className="flex-shrink-0">
          <div className="text-lg font-bold text-gray-900 tracking-tight">NewSense BodyCare</div>
          <div className="text-xs text-gray-500">체중·건강·체형 관리차트</div>
        </div>

        <div className="flex items-center gap-6 flex-1 justify-center">
          <nav className="flex items-center gap-6">
            {tabs.map((tab) => {
              const isActive =
                tab.key === resolvedTab ||
                (tab.activeOnPatient && isPatientPage && resolvedTab === 'manage');
              return (
                <Link
                  key={tab.key}
                  to={tab.path === '#' ? location.pathname : tab.path}
                  className={`text-sm font-medium pb-1 border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-primary border-primary'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
          <QuickSearch variant="nav" />
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm text-gray-600 whitespace-nowrap">
            직원 : <span className="font-medium text-gray-900">{staff.name}</span>
          </span>
          <Link
            to="/settings/admins"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap transition-colors"
            title="관리자 설정"
          >
            <Settings className="w-4 h-4" />
            관리자설정
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap transition-colors"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
