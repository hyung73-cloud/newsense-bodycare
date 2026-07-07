export type PatientProfileTab = 'summary' | 'records' | 'photos' | 'inbody';

interface PatientProfileTabsProps {
  active: PatientProfileTab;
  onChange: (tab: PatientProfileTab) => void;
}

const tabs: { key: PatientProfileTab; label: string }[] = [
  { key: 'summary', label: '요약' },
  { key: 'records', label: '기록' },
  { key: 'photos', label: '사진' },
  { key: 'inbody', label: '인바디' },
];

export default function PatientProfileTabs({ active, onChange }: PatientProfileTabsProps) {
  return (
    <div className="bg-white rounded-card shadow-card px-2 py-1.5 inline-flex gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            active === tab.key
              ? 'bg-primary text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
