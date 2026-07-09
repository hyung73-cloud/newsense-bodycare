import {
  Search,
  UserPlus,
  ClipboardList,
  AlertCircle,
  FileX,
  Camera,
  Printer,
} from 'lucide-react';

export type ShortcutKey =
  | 'search'
  | 'newPatient'
  | 'todayLog'
  | 'incomplete'
  | 'missingInbody'
  | 'missingPhoto'
  | 'print';

const shortcuts: { key: ShortcutKey; icon: typeof Search; label: string; color: string }[] = [
  { key: 'search', icon: Search, label: '환자 검색', color: 'text-blue-600 bg-blue-50' },
  { key: 'newPatient', icon: UserPlus, label: '신규 환자 등록', color: 'text-green-600 bg-green-50' },
  { key: 'todayLog', icon: ClipboardList, label: '오늘 입력 내역', color: 'text-purple-600 bg-purple-50' },
  { key: 'incomplete', icon: AlertCircle, label: '미완료 환자', color: 'text-red-600 bg-red-50' },
  { key: 'missingInbody', icon: FileX, label: '인바디 미업로드', color: 'text-orange-600 bg-orange-50' },
  { key: 'missingPhoto', icon: Camera, label: '사진 미업로드', color: 'text-cyan-600 bg-cyan-50' },
  { key: 'print', icon: Printer, label: '보고서 출력', color: 'text-gray-600 bg-gray-50' },
];

interface ShortcutMenuProps {
  onAction?: (key: ShortcutKey) => void;
}

export default function ShortcutMenu({ onAction }: ShortcutMenuProps) {
  return (
    <div className="panel-card p-5">
      <h3 className="panel-title mb-4">바로가기 메뉴</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 md:gap-3.5">
        {shortcuts.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onAction?.(s.key)}
            className="flex flex-col items-center gap-2.5 p-3 rounded-xl border border-transparent hover:bg-gray-50 hover:border-gray-200 transition-colors"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-600 text-center leading-tight font-medium">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
