import { useState } from 'react';
import { Camera, FileText, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Patient, Visit, VisitStatus } from '../types';

const INITIAL_LIMIT = 5;

interface TodayVisitRow extends Visit {
  patient: Patient;
  index: number;
}

type FilterKey = 'all' | VisitStatus;

interface TodayVisitTableProps {
  visits: TodayVisitRow[];
  className?: string;
}

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: '완료', label: '완료' },
  { key: '진행중', label: '진행중' },
  { key: '미완료', label: '미완료' },
];

export default function TodayVisitTable({ visits, className = '' }: TodayVisitTableProps) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

  const counts: Record<FilterKey, number> = {
    all: visits.length,
    완료: visits.filter((v) => v.status === '완료').length,
    진행중: visits.filter((v) => v.status === '진행중').length,
    미완료: visits.filter((v) => v.status === '미완료').length,
  };

  const filtered = filter === 'all' ? visits : visits.filter((v) => v.status === filter);
  const hasMore = filtered.length > INITIAL_LIMIT;
  const visibleVisits = expanded ? filtered : filtered.slice(0, INITIAL_LIMIT);

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
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-head">
              <th className="table-head-cell text-left">순번</th>
              <th className="table-head-cell text-left">방문일</th>
              <th className="table-head-cell text-left">차트번호</th>
              <th className="table-head-cell text-left">이름</th>
              <th className="table-head-cell text-left">성별/나이</th>
              <th className="table-head-cell text-right">체중</th>
              <th className="table-head-cell text-right">허리</th>
              <th className="table-head-cell text-center">사진</th>
              <th className="table-head-cell text-center">인바디</th>
              <th className="table-head-cell text-center">상태</th>
              <th className="table-head-cell text-left">패키지</th>
            </tr>
          </thead>
          <tbody>
            {visibleVisits.map((v, idx) => (
              <tr key={v.id} className="table-body-row">
                <td className="px-3 py-2.5 text-gray-600">{idx + 1}</td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{v.date.replace(/-/g, '.')}</td>
                <td className="px-3 py-2.5 text-gray-600">{v.patient.chartNo}</td>
                <td className="px-3 py-2.5 font-medium text-gray-900">
                  <Link to={`/patient/${v.patient.id}`} className="hover:text-primary hover:underline">
                    {v.patient.name}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                  {v.patient.sex}/{v.patient.ageAtToday}
                </td>
                <td className="px-3 py-2.5 text-right font-medium">{v.weightKg}</td>
                <td className="px-3 py-2.5 text-right font-medium">{v.waistCm}</td>
                <td className="px-3 py-2.5 text-center">
                  {v.photoUploaded ? (
                    <Camera className="w-3.5 h-3.5 text-green-500 inline" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400 inline" />
                  )}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {v.inbodyUploaded ? (
                    <FileText className="w-3.5 h-3.5 text-green-500 inline" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400 inline" />
                  )}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {v.status === '완료' ? (
                    <span className="inline-flex items-center gap-0.5 text-green-600 text-[11px] font-medium">
                      <CheckCircle className="w-3 h-3" />
                      완료
                    </span>
                  ) : v.status === '진행중' ? (
                    <span className="text-blue-600 text-[11px] font-medium">진행중</span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-red-500 text-[11px] font-medium">
                      <XCircle className="w-3 h-3" />
                      미완료
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {v.packageName ? (
                    <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold whitespace-nowrap">
                      {v.packageName}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">-</span>
                  )}
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
    </div>
  );
}
