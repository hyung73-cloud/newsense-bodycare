import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Save, ShieldCheck, ShieldAlert } from 'lucide-react';
import TopNav from '../components/TopNav';
import {
  canAccessAdminSettings,
  getAdminAccounts,
  saveAdminAccounts,
  validateAdminAccounts,
  type AdminAccount,
} from '../auth/adminAuth';
import { getStaff, setStaffName } from '../api/mock';
import { getServerAuthStatus } from '../auth/clinicAuth';

const STAFF_KEY = 'bodycare-staff-name-v1';

export default function AdminSettingsPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>(() =>
    getAdminAccounts().map((a) => ({ ...a })),
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [serverAuth, setServerAuth] = useState<{
    enabled: boolean;
    signedIn: boolean;
    email: string | null;
  } | null>(null);

  useEffect(() => {
    void getServerAuthStatus().then(setServerAuth);
  }, []);

  if (!canAccessAdminSettings(getStaff().name)) {
    return <Navigate to="/" replace />;
  }

  const updateRow = (id: string, field: 'name' | 'pin', value: string) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, [field]: field === 'pin' ? value.replace(/\D/g, '').slice(0, 6) : value }
          : a,
      ),
    );
    setMessage('');
    setError('');
  };

  const handleSave = async () => {
    const trimmed = accounts.map((a) => ({ ...a, name: a.name.trim() }));
    const validationError = validateAdminAccounts(trimmed);
    if (validationError) {
      setError(validationError);
      setMessage('');
      return;
    }

    const currentStaff = getStaff().name;
    const oldAccount = getAdminAccounts().find((a) => a.name === currentStaff);
    try {
      await saveAdminAccounts(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : '서버 저장에 실패했습니다.');
      setMessage('');
      return;
    }

    if (oldAccount) {
      const renamed = trimmed.find((a) => a.id === oldAccount.id);
      if (renamed && renamed.name !== currentStaff) {
        setStaffName(renamed.name);
        localStorage.setItem(STAFF_KEY, renamed.name);
      }
    }

    setAccounts(trimmed.map((a) => ({ ...a })));
    setError('');
    setMessage('관리자 정보가 서버에 저장되었습니다.');
  };

  return (
    <div className="min-h-screen bg-surface">
      <TopNav activeTab="dashboard" />

      <main className="max-w-[720px] mx-auto px-6 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">관리자 계정 설정</h1>
            <p className="text-sm text-gray-500 mt-1">
              관리자명과 PIN(6자리)을 변경할 수 있습니다. 변경 내용은 서버에 저장되어 모든 기기에 동일하게 적용됩니다.
              <span className="block mt-1 text-xs text-gray-400">
                이 페이지는 목록 1번 관리자({getAdminAccounts()[0]?.name ?? '-'})만 접근할 수 있습니다.
              </span>
            </p>
          </div>
          <Link to="/" className="btn-outline text-sm py-2">
            <ArrowLeft className="w-4 h-4" />
            대시보드
          </Link>
        </div>

        <div className="panel-card p-5">
          <div className="flex items-start gap-3">
            {serverAuth?.signedIn ? (
              <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <h2 className="font-bold text-gray-900">서버 보안 연결</h2>
              {serverAuth === null ? (
                <p className="text-gray-500 mt-1">확인 중…</p>
              ) : !serverAuth.enabled ? (
                <p className="text-gray-500 mt-1">Supabase 미연결 (로컬 모드)</p>
              ) : serverAuth.signedIn ? (
                <p className="text-green-700 mt-1">
                  로그인됨 — {serverAuth.email}
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Supabase Authentication에서 Last sign in 갱신을 확인하세요.
                  </span>
                </p>
              ) : (
                <p className="text-amber-700 mt-1">
                  서버 세션 없음 — 로그아웃 후 PIN으로 다시 로그인하세요.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="panel-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="panel-title">관리자 6명</h2>
            <p className="panel-subtitle mt-1">현재 기본 PIN: 327288 (각 계정에서 변경 가능)</p>
          </div>

          <div className="divide-y divide-gray-100">
            {accounts.map((account, index) => (
              <div key={account.id} className="px-5 py-4 grid grid-cols-12 gap-3 items-center">
                <div className="col-span-1 text-sm font-medium text-gray-400">{index + 1}</div>
                <div className="col-span-5">
                  <label className="block text-xs text-gray-500 mb-1">관리자명</label>
                  <input
                    value={account.name}
                    onChange={(e) => updateRow(account.id, 'name', e.target.value)}
                    className="input-field"
                    maxLength={10}
                  />
                </div>
                <div className="col-span-6">
                  <label className="block text-xs text-gray-500 mb-1">PIN (6자리)</label>
                  <input
                    value={account.pin}
                    onChange={(e) => updateRow(account.id, 'pin', e.target.value)}
                    inputMode="numeric"
                    type="password"
                    className="input-field tracking-[0.2em]"
                    placeholder="******"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
            <div className="text-xs">
              {error && <p className="text-red-500">{error}</p>}
              {message && <p className="text-green-600">{message}</p>}
            </div>
            <button type="button" onClick={handleSave} className="btn-primary">
              <Save className="w-4 h-4" />
              저장
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
