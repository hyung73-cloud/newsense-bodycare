import { useState } from 'react';
import { Camera, FileText, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Patient, Visit } from '../types';

const INITIAL_LIMIT = 5;

interface TodayVisitRow extends Visit {
  patient: Patient;
  index: number;
}

interface TodayVisitTableProps {
  visits: TodayVisitRow[];
  className?: string;
}

export default function TodayVisitTable({ visits, className = '' }: TodayVisitTableProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = visits.length > INITIAL_LIMIT;
  const visibleVisits = expanded ? visits : visits.slice(0, INITIAL_LIMIT);

  return (
    <div className={`bg-white rounded-card shadow-card overflow-hidden flex flex-col ${className}`}>
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <h3 className="font-bold text-gray-900 text-sm">오늘 방문 환자 리스트</h3>
      </div>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="px-2.5 py-2 text-left font-medium">순번</th>
              <th className="px-2.5 py-2 text-left font-medium">방문일</th>
              <th className="px-2.5 py-2 text-left font-medium">차트번호</th>
              <th className="px-2.5 py-2 text-left font-medium">이름</th>
              <th className="px-2.5 py-2 text-left font-medium">성별/나이</th>
              <th className="px-2.5 py-2 text-right font-medium">체중</th>
              <th className="px-2.5 py-2 text-right font-medium">허리</th>
              <th className="px-2.5 py-2 text-center font-medium">사진</th>
              <th className="px-2.5 py-2 text-center font-medium">인바디</th>
              <th className="px-2.5 py-2 text-center font-medium">상태</th>
              <th className="px-2.5 py-2 text-center font-medium">작업</th>
            </tr>
          </thead>
          <tbody>
            {visibleVisits.map((v) => (
              <tr key={v.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="px-2.5 py-2 text-gray-600">{v.index}</td>
                <td className="px-2.5 py-2 text-gray-600 whitespace-nowrap">{v.date.replace(/-/g, '.')}</td>
                <td className="px-2.5 py-2 text-gray-600">{v.patient.chartNo}</td>
                <td className="px-2.5 py-2 font-medium text-gray-900">{v.patient.name}</td>
                <td className="px-2.5 py-2 text-gray-600 whitespace-nowrap">
                  {v.patient.sex}/{v.patient.ageAtToday}
                </td>
                <td className="px-2.5 py-2 text-right font-medium">{v.weightKg}</td>
                <td className="px-2.5 py-2 text-right font-medium">{v.waistCm}</td>
                <td className="px-2.5 py-2 text-center">
                  {v.photoUploaded ? (
                    <Camera className="w-3.5 h-3.5 text-green-500 inline" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400 inline" />
                  )}
                </td>
                <td className="px-2.5 py-2 text-center">
                  {v.inbodyUploaded ? (
                    <FileText className="w-3.5 h-3.5 text-green-500 inline" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400 inline" />
                  )}
                </td>
                <td className="px-2.5 py-2 text-center">
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
                <td className="px-2.5 py-2 text-center">
                  <Link
                    to={`/patient/${v.patient.id}`}
                    className="text-[11px] text-primary border border-primary/30 px-2 py-0.5 rounded hover:bg-blue-50"
                  >
                    보기
                  </Link>
                </td>
              </tr>
            ))}
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
            {expanded ? '접기' : `더보기 (${visits.length - INITIAL_LIMIT}명)`}
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
}
