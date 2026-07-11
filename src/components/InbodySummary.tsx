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
  /** 최신 체형결과지 이미지 URL */
  bodyShapeSheetUrl?: string;
}

export default function InbodySummary({ records, bodyShapeSheetUrl }: InbodySummaryProps) {
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [zoomTitle, setZoomTitle] = useState('');
  const latest = records[records.length - 1];
  const first = records[0];
  const inbodySheetUrl = latest?.sheetImageUrl?.trim() || '';
  const bodySheetUrl = bodyShapeSheetUrl?.trim() || '';

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

  const openZoom = (url: string, title: string) => {
    if (!url) return;
    setZoomUrl(url);
    setZoomTitle(title);
  };

  return (
    <>
      <div className="panel-card p-5 h-full">
        <h3 className="panel-title mb-4">인바디·체형 결과 요약</h3>
        <div className="flex gap-4">
          <div className="flex gap-2 flex-shrink-0">
            <SheetThumb
              label="인바디"
              url={inbodySheetUrl}
              onClick={() => openZoom(inbodySheetUrl, '인바디 기록지')}
            />
            <SheetThumb
              label="체형"
              url={bodySheetUrl}
              onClick={() => openZoom(bodySheetUrl, '체형결과지')}
            />
          </div>
          <div className="flex-1 overflow-x-auto min-w-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="table-head text-gray-400">
                  <th className="table-head-cell text-left">항목</th>
                  {records.map((r) => (
                    <th key={r.date} className="table-head-cell text-right">
                      {r.date.slice(5).replace('-', '.')}
                    </th>
                  ))}
                  <th className="table-head-cell text-right text-primary">변화</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="table-body-row">
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
        <div className="mt-3 flex flex-wrap gap-3">
          {inbodySheetUrl && (
            <button
              type="button"
              onClick={() => openZoom(inbodySheetUrl, '인바디 기록지')}
              className="text-xs text-primary hover:underline"
            >
              인바디 기록지 전체보기 →
            </button>
          )}
          {bodySheetUrl && (
            <button
              type="button"
              onClick={() => openZoom(bodySheetUrl, '체형결과지')}
              className="text-xs text-primary hover:underline"
            >
              체형결과지 전체보기 →
            </button>
          )}
        </div>
      </div>

      {zoomUrl && (
        <ImageZoomModal url={zoomUrl} title={zoomTitle} onClose={() => setZoomUrl(null)} />
      )}
    </>
  );
}

function SheetThumb({
  label,
  url,
  onClick,
}: {
  label: string;
  url: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!url}
      className="w-[4.5rem] h-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 hover:opacity-80 transition-opacity disabled:opacity-100 disabled:cursor-default relative border border-gray-100"
    >
      {url ? (
        <img src={url} alt={label} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 px-1 text-center leading-tight">
          {label}
          <br />
          미업로드
        </div>
      )}
      <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[9px] py-0.5 text-center">
        {label}
      </span>
    </button>
  );
}
