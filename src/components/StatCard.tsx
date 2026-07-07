import { Camera } from 'lucide-react';

interface StatCardProps {
  className?: string;
}

export default function StatCard({ className = '' }: StatCardProps) {
  return (
    <div
      className={`bg-primary rounded-card p-5 text-white shadow-card cursor-pointer hover:bg-blue-700 transition-colors ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Camera className="w-6 h-6" />
        </div>
        <div>
          <div className="text-base font-bold">오늘 입력하기</div>
          <div className="text-xs text-blue-100 mt-0.5">PIN 입력 후 신규/재진 환자 등록</div>
        </div>
      </div>
    </div>
  );
}
