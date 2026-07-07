import { Camera } from 'lucide-react';

interface StatCardProps {
  className?: string;
  onClick?: () => void;
}

export default function StatCard({ className = '', onClick }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left bg-primary rounded-card p-5 text-white shadow-elevated hover:bg-blue-700 transition-colors ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Camera className="w-6 h-6" />
        </div>
        <div>
          <div className="text-base font-bold">오늘 입력하기</div>
          <div className="text-xs text-blue-100 mt-0.5">신규/재진 환자 등록 · 오늘 기록 입력</div>
        </div>
      </div>
    </button>
  );
}
