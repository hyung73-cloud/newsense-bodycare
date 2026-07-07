import { useState } from 'react';
import ImageZoomModal from './ImageZoomModal';

interface InbodyRow {
  date: string;
  weightKg: number;
  skeletalMuscleKg: number;
  bodyFatPct: number;
  visceralLevel: number;
  sheetImageUrl: string;
}

interface InbodySummaryProps {
  records: InbodyRow[];
}

export default function InbodySummary({ records }: InbodySummaryProps) {
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const latest = records[records.length - 1];
  const first = records[0];

  const calcChange = (latestVal: number, firstVal: number) => {
    const diff = latestVal - firstVal;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}`;
  };

  const rows = [
    { label: '체중(kg)', key: 'weightKg' as const },
    { label: '골격근량(kg)', key: 'skeletalMuscleKg' as const },
    { label: '체지방률(%)', key: 'bodyFatPct' as const },
    { label: '내장지방레벨', key: 'visceralLevel' as const },
  ];

  return (
    <>
      <div className="panel-card p-5 h-full">
        <h3 className="panel-title mb-4">인바디 결과 요약</h3>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => latest && setZoomUrl(latest.sheetImageUrl)}
            className="w-24 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            {latest && (
              <img src={latest.sheetImageUrl} alt="인바디" className="w-full h-full object-cover" />
            )}
          </button>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="table-head text-gray-400">
                  <th className="table-head-cell text-left">항목</th>
                  {records.map((r) => (
                    <th key={r.date} className="text-right py-1.5 font-medium">
                      {r.date.slice(5).replace('-', '.')}
                    </th>
                  ))}
                  <th className="text-right py-1.5 font-medium text-primary">변화</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-t border-gray-50">
                    <td className="py-2 text-gray-600">{row.label}</td>
                    {records.map((r) => (
                      <td key={r.date} className="py-2 text-right font-medium text-gray-900">
                        {r[row.key]}
                      </td>
                    ))}
                    <td className="py-2 text-right font-bold text-primary">
                      {first && latest ? calcChange(latest[row.key], first[row.key]) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <button
          type="button"
          onClick={() => latest && setZoomUrl(latest.sheetImageUrl)}
          className="mt-3 text-xs text-primary hover:underline"
        >
          인바디 기록지 전체보기 →
        </button>
      </div>

      {zoomUrl && <ImageZoomModal url={zoomUrl} onClose={() => setZoomUrl(null)} />}
    </>
  );
}
