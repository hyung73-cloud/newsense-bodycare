import { Camera, FileText, CheckCircle, XCircle, Pencil, Trash2 } from 'lucide-react';
import type { Visit } from '../types';

interface VisitHistoryTableProps {
  visits: Visit[];
  onEdit: (visit: Visit) => void;
  onDelete: (visit: Visit) => void;
}

export default function VisitHistoryTable({ visits, onEdit, onDelete }: VisitHistoryTableProps) {
  if (visits.length === 0) {
    return (
      <div className="panel-card p-10 text-center text-gray-500 text-sm">
        등록된 방문 기록이 없습니다.
      </div>
    );
  }

  return (
    <div className="panel-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">방문 기록 히스토리</h3>
        <p className="text-xs text-gray-400 mt-0.5">총 {visits.length}회 방문</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-head">
              <th className="table-head-cell text-left">방문일</th>
              <th className="table-head-cell text-right">체중</th>
              <th className="table-head-cell text-right">허리</th>
              <th className="table-head-cell text-right">체지방</th>
              <th className="table-head-cell text-right">골격근</th>
              <th className="table-head-cell text-right">내장지방</th>
              <th className="table-head-cell text-center">사진</th>
              <th className="table-head-cell text-center">인바디</th>
              <th className="table-head-cell text-center">상태</th>
              <th className="table-head-cell text-left">메모</th>
              <th className="table-head-cell text-center">작업</th>
            </tr>
          </thead>
          <tbody>
            {[...visits].reverse().map((v) => (
              <tr key={v.id} className="table-body-row">
                <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                  {v.date.replace(/-/g, '.')}
                </td>
                <td className="px-3 py-2.5 text-right font-medium">{v.weightKg} kg</td>
                <td className="px-3 py-2.5 text-right font-medium">{v.waistCm} cm</td>
                <td className="px-3 py-2.5 text-right font-medium">{v.bodyFatPct}%</td>
                <td className="px-3 py-2.5 text-right font-medium">{v.skeletalMuscleKg} kg</td>
                <td className="px-3 py-2.5 text-right font-medium">{v.visceralLevel}</td>
                <td className="px-3 py-2.5 text-center">
                  {v.photoUploaded ? (
                    <Camera className="w-4 h-4 text-green-500 inline" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 inline" />
                  )}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {v.inbodyUploaded ? (
                    <FileText className="w-4 h-4 text-green-500 inline" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 inline" />
                  )}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <StatusBadge status={v.status} />
                </td>
                <td className="px-3 py-2.5 text-gray-600 max-w-[200px] truncate" title={v.doctorNote}>
                  {v.doctorNote || '-'}
                </td>
                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onEdit(v)}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mr-2"
                  >
                    <Pencil className="w-3 h-3" />
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(v)}
                    className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline"
                  >
                    <Trash2 className="w-3 h-3" />
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Visit['status'] }) {
  if (status === '완료') {
    return (
      <span className="inline-flex items-center gap-0.5 text-green-600 text-xs">
        <CheckCircle className="w-3 h-3" />
        완료
      </span>
    );
  }
  if (status === '진행중') {
    return <span className="text-blue-600 text-xs">진행중</span>;
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-red-500 text-xs">
      <XCircle className="w-3 h-3" />
      미완료
    </span>
  );
}
