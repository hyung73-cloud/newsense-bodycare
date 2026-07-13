import { useState } from 'react';
import {
  Camera,
  FileText,
  CheckCircle,
  XCircle,
  ChevronRight,
  Plus,
  StickyNote,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Patient, Visit, VisitStatus } from '../types';
import type { VisitFormData } from '../api/mock';
import { updateVisit } from '../api/mock';
import { formatWon, getPackageDisplay } from '../lib/packageDisplay';
import PackageReceiptModal from './PackageReceiptModal';
import VisitFormModal from './VisitFormModal';

const INITIAL_LIMIT = 5;

interface TodayVisitRow extends Visit {
  patient: Patient;
  index: number;
}

type FilterKey = 'all' | VisitStatus;

interface TodayVisitTableProps {
  visits: TodayVisitRow[];
  className?: string;
  onPackageUpdated?: () => void;
}

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: '완료', label: '완료' },
  { key: '진행중', label: '진행중' },
  { key: '미완료', label: '미완료' },
];

const statusStyles: Record<VisitStatus, string> = {
  완료: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  진행중: 'bg-blue-50 text-blue-700 border-blue-100',
  미완료: 'bg-rose-50 text-rose-600 border-rose-100',
};

function StatusBadge({ status }: { status: VisitStatus }) {
  const Icon = status === '완료' ? CheckCircle : status === '미완료' ? XCircle : null;
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${statusStyles[status]}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {status}
    </span>
  );
}

function PackageCell({
  visit,
  onOpen,
}: {
  visit: TodayVisitRow;
  onOpen: () => void;
}) {
  const pkg = getPackageDisplay(visit);
  if (!pkg) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:bg-primary/5 rounded-lg px-1.5 py-1"
      >
        <Plus className="w-3.5 h-3.5" /> 등록
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex items-center gap-1 w-full min-w-[8.5rem] rounded-lg px-1.5 py-1 hover:bg-primary/5 transition-colors text-left"
      title="패키지권 전체 영수증 보기"
    >
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold text-primary truncate group-hover:underline">{pkg.title}</div>
        {pkg.price > 0 && (
          <div className="text-[10px] font-bold text-gray-900 tabular-nums">{formatWon(pkg.price)}</div>
        )}
      </div>
      <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-primary shrink-0 transition-colors" />
    </button>
  );
}

function MemoCell({
  visit,
  onOpen,
}: {
  visit: TodayVisitRow;
  onOpen: () => void;
}) {
  const note = visit.doctorNote?.trim() ?? '';
  const preview =
    note &&
    !note.startsWith('패키지 등록:') &&
    note !== '오늘 체형 사진 업로드' &&
    note !== '그전 체형 사진 업로드'
      ? note
      : '';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-lg px-1.5 py-1 hover:bg-amber-50 transition-colors"
      title={preview || '메모 작성'}
    >
      <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700">
        <StickyNote className="w-3.5 h-3.5 shrink-0" />
        {preview ? '메모' : '작성'}
      </div>
      {preview ? (
        <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{preview}</p>
      ) : (
        <p className="text-[10px] text-gray-300 mt-0.5">-</p>
      )}
    </button>
  );
}

export default function TodayVisitTable({ visits, className = '', onPackageUpdated }: TodayVisitTableProps) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [receiptVisit, setReceiptVisit] = useState<TodayVisitRow | null>(null);
  const [memoVisit, setMemoVisit] = useState<TodayVisitRow | null>(null);

  const counts: Record<FilterKey, number> = {
    all: visits.length,
    완료: visits.filter((v) => v.status === '완료').length,
    진행중: visits.filter((v) => v.status === '진행중').length,
    미완료: visits.filter((v) => v.status === '미완료').length,
  };

  const filtered = filter === 'all' ? visits : visits.filter((v) => v.status === filter);
  const hasMore = filtered.length > INITIAL_LIMIT;
  const visibleVisits = expanded ? filtered : filtered.slice(0, INITIAL_LIMIT);

  const handleMemoSave = async (data: VisitFormData) => {
    if (!memoVisit) return;
    try {
      await updateVisit(memoVisit.id, data);
      onPackageUpdated?.();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '메모 저장에 실패했습니다.');
    }
  };

  return (
    <div className={`panel-card overflow-hidden flex flex-col ${className}`}>
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0 flex items-center justify-between gap-3 flex-wrap">
        <h3 className="panel-title">오늘 방문 환자 리스트</h3>
        <div className="flex items-center gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setFilter(f.key);
                setExpanded(false);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === f.key
                  ? 'bg-primary text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f.label}
              <span className={`ml-1 ${filter === f.key ? 'text-blue-100' : 'text-gray-400'}`}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="table-head">
              <th className="table-head-cell text-center w-10">순번</th>
              <th className="table-head-cell text-left w-[4.5rem]">차트</th>
              <th className="table-head-cell text-left w-20">이름</th>
              <th className="table-head-cell text-center w-16">나이</th>
              <th className="table-head-cell text-right w-12">체중</th>
              <th className="table-head-cell text-right w-12">허리</th>
              <th className="table-head-cell text-center w-10 px-1" title="사진">
                사진
              </th>
              <th className="table-head-cell text-center w-10 px-1" title="인바디">
                인바디
              </th>
              <th className="table-head-cell text-center w-[5.5rem] sticky right-[18rem] z-20 bg-gray-50 shadow-[-6px_0_10px_-8px_rgba(0,0,0,0.12)]">
                상태
              </th>
              <th className="table-head-cell text-left w-[8.5rem] sticky right-[9.5rem] z-20 bg-gray-50">
                메모
              </th>
              <th className="table-head-cell text-left w-[9.5rem] sticky right-0 z-20 bg-gray-50">
                패키지
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleVisits.map((v, idx) => (
              <tr key={v.id} className="table-body-row group">
                <td className="px-2 py-2.5 text-center text-gray-500 align-middle tabular-nums text-xs">
                  {idx + 1}
                </td>
                <td className="px-2 py-2.5 text-gray-600 whitespace-nowrap align-middle tabular-nums text-xs">
                  {v.patient.chartNo}
                </td>
                <td className="px-2 py-2.5 font-medium text-gray-900 align-middle whitespace-nowrap text-xs">
                  <Link to={`/patient/${v.patient.id}`} className="hover:text-primary hover:underline">
                    {v.patient.name}
                  </Link>
                </td>
                <td className="px-2 py-2.5 text-gray-600 whitespace-nowrap align-middle text-center text-xs">
                  {v.patient.ageAtToday > 0 ? `${v.patient.ageAtToday}세` : '-'}
                </td>
                <td className="px-2 py-2.5 text-right font-medium align-middle tabular-nums text-xs">
                  {v.weightKg}
                </td>
                <td className="px-2 py-2.5 text-right font-medium align-middle tabular-nums text-xs">
                  {v.waistCm}
                </td>
                <td className="px-1 py-2.5 text-center align-middle">
                  {v.photoUploaded ? (
                    <Camera className="w-3.5 h-3.5 text-emerald-500 inline" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 inline" />
                  )}
                </td>
                <td className="px-1 py-2.5 text-center align-middle">
                  {v.inbodyUploaded ? (
                    <FileText className="w-3.5 h-3.5 text-emerald-500 inline" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 inline" />
                  )}
                </td>
                <td className="px-2 py-2.5 text-center align-middle sticky right-[18rem] z-10 bg-white group-hover:bg-gray-50/70 shadow-[-6px_0_10px_-8px_rgba(0,0,0,0.08)]">
                  <StatusBadge status={v.status} />
                </td>
                <td className="px-1 py-2.5 align-middle sticky right-[9.5rem] z-10 bg-white group-hover:bg-gray-50/70">
                  <MemoCell visit={v} onOpen={() => setMemoVisit(v)} />
                </td>
                <td className="px-2 py-2.5 align-middle sticky right-0 z-10 bg-white group-hover:bg-gray-50/70">
                  <PackageCell visit={v} onOpen={() => setReceiptVisit(v)} />
                </td>
              </tr>
            ))}
            {visibleVisits.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-xs text-gray-400">
                  해당 상태의 방문 기록이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="px-4 py-2 border-t border-gray-100 text-center flex-shrink-0 mt-auto">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
          >
            {expanded ? '접기' : `더보기 (${filtered.length - INITIAL_LIMIT}명)`}
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      )}
      {receiptVisit && (
        <PackageReceiptModal
          open
          visit={receiptVisit}
          patient={receiptVisit.patient}
          onClose={() => setReceiptVisit(null)}
          onSaved={onPackageUpdated}
        />
      )}
      {memoVisit && (
        <VisitFormModal
          open
          mode="edit"
          initial={memoVisit}
          onClose={() => setMemoVisit(null)}
          onSave={(data) => {
            void handleMemoSave(data);
            setMemoVisit(null);
          }}
        />
      )}
    </div>
  );
}
