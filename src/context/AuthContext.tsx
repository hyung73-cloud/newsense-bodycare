import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PinLoginGate from '../components/PinLoginGate';
import { getDefaultAdminName } from '../auth/adminAuth';
import { signInClinic, signOutClinic, restoreClinicSession, isClinicAuthEnabled } from '../auth/clinicAuth';
import { setStaffName, resetInitPromise } from '../api/mock';

const AUTH_KEY = 'bodycare-auth-v1';
const STAFF_KEY = 'bodycare-staff-name-v1';

const PUBLIC_PATH_PREFIXES = ['/package', '/bodycare-package'];

interface AuthContextValue {
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(false);
  const [booting, setBooting] = useState(true);

  const isPublicRoute = PUBLIC_PATH_PREFIXES.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    let cancelled = false;
    const savedAuth = localStorage.getItem(AUTH_KEY) === '1';
    const savedStaff = localStorage.getItem(STAFF_KEY);
    if (savedStaff) setStaffName(savedStaff);

    const finishBoot = () => {
      if (!cancelled) setBooting(false);
    };

    const bootTimeout = window.setTimeout(finishBoot, 6000);

    if (savedAuth && isClinicAuthEnabled()) {
      void restoreClinicSession()
        .then((hasSession) => {
          if (!hasSession) {
            localStorage.removeItem(AUTH_KEY);
            setAuthenticated(false);
          } else {
            resetInitPromise();
            setAuthenticated(true);
          }
        })
        .catch(() => {
          localStorage.removeItem(AUTH_KEY);
          setAuthenticated(false);
        })
        .finally(() => {
          window.clearTimeout(bootTimeout);
          finishBoot();
        });
      return () => {
        cancelled = true;
        window.clearTimeout(bootTimeout);
      };
    }

    window.clearTimeout(bootTimeout);
    setAuthenticated(savedAuth);
    finishBoot();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (adminName: string, pin: string) => {
    if (isClinicAuthEnabled()) await signInClinic(pin);
    setStaffName(adminName);
    localStorage.setItem(STAFF_KEY, adminName);
    localStorage.setItem(AUTH_KEY, '1');
    resetInitPromise();
    setAuthenticated(true);
    navigate('/', { replace: true });
  };

  const logout = () => {
    void signOutClinic();
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(STAFF_KEY);
    setStaffName(getDefaultAdminName());
    setAuthenticated(false);
    navigate('/', { replace: true });
  };

  if (booting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-gray-500">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">앱 준비 중…</p>
      </div>
    );
  }

  if (!authenticated && !isPublicRoute) {
    return <PinLoginGate onLogin={login} />;
  }

  return <AuthContext.Provider value={{ logout }}>{children}</AuthContext.Provider>;
}
