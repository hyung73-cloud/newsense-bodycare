interface ResearchItem {
  label: string;
  value: string;
  range: string;
  highlight?: boolean;
}

interface ResearchPanelProps {
  items: ResearchItem[];
}

export default function ResearchPanel({ items }: ResearchPanelProps) {
  return (
      <div className="panel-card p-5 h-full">
        <h3 className="panel-title mb-4">연구 항목</h3>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="border-b border-gray-50 pb-3 last:border-0">
            <div className="text-xs text-gray-500 mb-1">{item.label}</div>
            <div className={`text-lg font-bold ${item.highlight ? 'text-red-500' : 'text-gray-900'}`}>
              {item.value}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">({item.range})</div>
          </div>
        ))}
      </div>
    </div>
  );
}
