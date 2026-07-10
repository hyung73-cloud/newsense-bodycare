import { useEffect, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { getAdminAccounts, getDefaultAdminName, verifyAdminPin } from '../auth/adminAuth';

const NATURE_BG =
  'https://images.unsplash.com/photo-1518020382113-a7e8c38c541f?w=1920&h=1080&fit=crop&q=80';

interface PinLoginGateProps {
  onLogin: (adminName: string, pin: string) => Promise<void>;
}

export default function PinLoginGate({ onLogin }: PinLoginGateProps) {
  const [adminAccounts, setAdminAccounts] = useState(() => getAdminAccounts());
  const [adminName, setAdminName] = useState(() => getDefaultAdminName());
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const accounts = getAdminAccounts();
    setAdminAccounts(accounts);
    setAdminName((prev) => {
      if (accounts.some((a) => a.name === prev)) return prev;
      return accounts[0]?.name ?? prev;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError('PIN 번호는 6자리로 입력해주세요.');
      return;
    }
    if (!adminName.trim()) {
      setError('관리자명을 선택해주세요.');
      return;
    }
    if (!verifyAdminPin(adminName, pin)) {
      setError('관리자명 또는 PIN 번호가 일치하지 않습니다.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onLogin(adminName.trim(), pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${NATURE_BG})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/55" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6 text-white">
          <p className="text-sm font-medium tracking-wide text-white/90">NewSense</p>
          <h1 className="text-2xl font-bold tracking-tight mt-1">자연과 함께하는 건강 관리</h1>
          <p className="text-xs text-white/75 mt-2">관리자 PIN 로그인 후 BodyCare 차트에 접속합니다.</p>
        </div>

        <div className="panel-card w-full p-6 bg-white/92 backdrop-blur-md shadow-xl border border-white/40">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <LockKeyhole className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">관리자 로그인</h2>
              <p className="text-xs text-gray-500 mt-0.5">6자리 PIN 번호를 입력해주세요.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">관리자명</label>
              <select
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="input-field"
              >
                {adminAccounts.map((account) => (
                  <option key={account.id} value={account.name}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">관리자 PIN (6자리)</label>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                type="password"
                className="input-field tracking-[0.25em]"
                placeholder="******"
                autoFocus
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
              {submitting ? '로그인 중…' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
