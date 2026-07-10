import { useEffect, useState } from 'react';
import { CalendarClock, Check, ExternalLink, X } from 'lucide-react';
import { submitPackageConsult } from '../api/packageConsult';
import { useToast } from '../context/ToastContext';
import { openKakaoChannelConsult } from '../lib/kakaoChannel';

interface PackageConsultModalProps {
  open: boolean;
  onClose: () => void;
  packageSummary: string;
  total: number;
}

export default function PackageConsultModal({
  open,
  onClose,
  packageSummary,
  total,
}: PackageConsultModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [visitTime, setVisitTime] = useState('10:00');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setPhone('');
      setVisitDate(new Date().toISOString().slice(0, 10));
      setVisitTime('10:00');
      setError(null);
      setSubmitting(false);
      setCompleted(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !visitDate || !visitTime) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await submitPackageConsult({
        name: name.trim(),
        phone: phone.trim(),
        visitDate,
        visitTime,
        packageSummary,
        total,
      });
      setCompleted(true);
      showToast('방문 패키지 상담이 등록되었습니다.');
    } catch (err) {
      const message = err instanceof Error ? err.message : '상담 등록에 실패했습니다.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKakao = () => {
    openKakaoChannelConsult();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {completed ? '상담 등록 완료' : '방문 패키지 상담 등록'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {completed ? (
          <div className="space-y-4">
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-gray-900">뉴센스의원 채널톡에 등록되었습니다.</p>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                카카오톡으로 상담을 이어가시면
                <br />
                병원 답변을 카톡으로 받으실 수 있습니다.
              </p>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed px-1">
              아래 버튼을 누르면 카카오톡 상담창이 열립니다.
              <br />
              ① 채널 추가 안내가 나오면 <strong className="text-gray-600">「예」</strong>를 눌러 주세요.
              <br />
              ② 카카오톡 안의 노란 버튼을 누른 뒤 <strong className="text-gray-600">이름을 한 번</strong> 입력해 주세요.
            </p>

            <button
              type="button"
              onClick={handleKakao}
              className="w-full flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#f5dc00] text-[#3C1E1E] font-bold py-3.5 rounded-xl transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              카카오톡으로 상담하기
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-4">
              입력하신 내용은 뉴센스의원 채널톡으로 전달됩니다. 등록 후 카카오톡 상담도 이어가실 수 있습니다.
            </p>

            <div className="mb-4 p-3 rounded-xl bg-gray-50 text-xs text-gray-600 space-y-1">
              <div className="font-semibold text-gray-800">선택 패키지</div>
              <div>{packageSummary || '—'}</div>
              <div className="pt-1 font-bold text-primary">{total.toLocaleString('ko-KR')}원</div>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예) 김뉴센"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">연락처</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="예) 010-1234-5678"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">방문희망일</label>
                  <input
                    type="date"
                    value={visitDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">방문희망시간</label>
                  <input
                    type="time"
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg whitespace-pre-wrap">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !name.trim() || !phone.trim()}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <CalendarClock className="w-5 h-5" />
                {submitting ? '전송 중…' : '상담 등록 완료'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
