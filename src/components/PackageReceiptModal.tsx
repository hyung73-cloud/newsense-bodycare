import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Ticket, Printer, Pencil, Plus, Trash2, Save } from 'lucide-react';
import type { PackageTicketLine, Patient, Visit } from '../types';
import { formatWon, getPackageTickets, sumTicketPrices } from '../lib/packageDisplay';
import { updateVisitPackage } from '../api/mock';

interface PackageReceiptModalProps {
  open: boolean;
  visit: Visit;
  patient: Patient;
  onClose: () => void;
  onSaved?: () => void;
}

export default function PackageReceiptModal({
  open,
  visit,
  patient,
  onClose,
  onSaved,
}: PackageReceiptModalProps) {
  const [editing, setEditing] = useState(false);
  const [packageName, setPackageName] = useState('');
  const [tickets, setTickets] = useState<PackageTicketLine[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEditing(false);
    setPackageName(visit.packageName?.trim() ?? '');
    setTickets(getPackageTickets(visit));
  }, [open, visit]);

  const total = useMemo(() => sumTicketPrices(tickets), [tickets]);
  const storedTotal = visit.packagePrice ?? total;
  const displayTotal = editing ? total : storedTotal > 0 ? storedTotal : total;

  if (!open) return null;

  const updateTicket = (index: number, patch: Partial<PackageTicketLine>) => {
    setTickets((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const addTicket = () => {
    setTickets((prev) => [...prev, { label: '', sub: '', price: 0 }]);
  };

  const removeTicket = (index: number) => {
    setTickets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const name = packageName.trim();
    const validTickets = tickets
      .map((t) => ({
        label: t.label.trim(),
        sub: t.sub?.trim() || undefined,
        price: Number.isFinite(t.price) ? t.price : 0,
      }))
      .filter((t) => t.label);

    if (!name) {
      window.alert('패키지명을 입력해주세요.');
      return;
    }
    if (validTickets.length === 0) {
      window.alert('시술권 항목을 1개 이상 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      updateVisitPackage(visit.id, { packageName: name, packageTickets: validTickets });
      setEditing(false);
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setPackageName(visit.packageName?.trim() ?? '');
    setTickets(getPackageTickets(visit));
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">패키지권 전체 영수증</h2>
              <p className="text-[11px] text-gray-500">방문일 {visit.date.replace(/-/g, '.')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-gray-400">환자</div>
            <div className="font-bold text-gray-900">{patient.name}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-gray-400">차트번호</div>
            <div className="font-bold text-gray-900">{patient.chartNo}</div>
          </div>
        </div>

        {editing ? (
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">패키지명</label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="예: Basic · 체중관리"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">시술권 항목</span>
                <button
                  type="button"
                  onClick={addTicket}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> 항목 추가
                </button>
              </div>

              {tickets.map((t, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50/50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={t.label}
                      onChange={(e) => updateTicket(i, { label: e.target.value })}
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
                      placeholder="품목명"
                    />
                    <button
                      type="button"
                      onClick={() => removeTicket(i)}
                      className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center flex-shrink-0"
                      aria-label="항목 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={t.sub ?? ''}
                      onChange={(e) => updateTicket(i, { sub: e.target.value })}
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs"
                      placeholder="부가 설명 (선택)"
                    />
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={t.price}
                      onChange={(e) => updateTicket(i, { price: Number(e.target.value) || 0 })}
                      className="w-28 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-right"
                      placeholder="금액"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between px-1 py-2 border-t border-gray-100">
              <span className="font-bold text-gray-900">합계 ({tickets.length}건)</span>
              <span className="text-lg font-extrabold text-primary">{formatWon(total)}</span>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-gray-50">
              <div className="text-[11px] text-gray-400 mb-0.5">패키지</div>
              <div className="font-bold text-primary">{packageName || visit.packageName || '-'}</div>
            </div>

            <ul className="divide-y divide-gray-50">
              {tickets.map((t, i) => (
                <li key={i} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Ticket className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 break-words">{t.label}</div>
                      {t.sub && <div className="text-[11px] text-gray-400">{t.sub}</div>}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-800 flex-shrink-0">
                    {t.price > 0 ? formatWon(t.price) : '-'}
                  </span>
                </li>
              ))}
            </ul>

            <div className="px-5 py-4 bg-primary/5 flex items-center justify-between">
              <span className="font-bold text-gray-900">합계 ({tickets.length}건)</span>
              <span className="text-xl font-extrabold text-primary">{formatWon(displayTotal)}</span>
            </div>
          </>
        )}

        <div className="sticky bottom-0 flex gap-2 px-5 py-4 border-t border-gray-100 bg-white rounded-b-2xl">
          {editing ? (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? '저장 중…' : '저장'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50"
              >
                <Printer className="w-4 h-4" /> 인쇄
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-2.5 rounded-xl hover:bg-blue-700"
              >
                <Pencil className="w-4 h-4" /> 수정
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
