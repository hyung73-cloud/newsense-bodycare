import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Camera,
  FileText,
  XCircle,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import TopNav from '../components/TopNav';
import StatCard from '../components/StatCard';
import RecentPatientCard from '../components/RecentPatientCard';
import TodayVisitTable from '../components/TodayVisitTable';
import VisitCalendar from '../components/VisitCalendar';
import ProgressDonut from '../components/ProgressDonut';
import ProcedureTagBar from '../components/ProcedureTagBar';
import ShortcutMenu, { type ShortcutKey } from '../components/ShortcutMenu';
import TodayInputModal from '../components/TodayInputModal';
import VisitListDrawer from '../components/VisitListDrawer';
import { useToast } from '../context/ToastContext';
import {
  getTodayStats,
  getProgressStats,
  getRecentMemos,
  getRecentPatients,
  getTodayVisits,
  getProcedureTags,
  getRecentPatientCardData,
  getTodayVisitsIncomplete,
  getTodayVisitsMissingInbody,
  getTodayVisitsMissingPhoto,
} from '../api/mock';
import type { Patient, Visit } from '../types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [timestamp, setTimestamp] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [todayInputOpen, setTodayInputOpen] = useState(false);
  const [drawer, setDrawer] = useState<{ title: string; visits: (Visit & { patient: Patient })[] } | null>(null);
  void refreshKey;

  useEffect(() => {
    const timer = setInterval(() => setTimestamp(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleShortcut = (key: ShortcutKey) => {
    switch (key) {
      case 'search': {
        const el = document.getElementById('nav-quicksearch') as HTMLInputElement | null;
        el?.focus();
        break;
      }
      case 'newPatient':
        setTodayInputOpen(true);
        break;
      case 'todayLog':
        document.getElementById('today-visit-table')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'incomplete':
        setDrawer({ title: '미완료 환자', visits: getTodayVisitsIncomplete() });
        break;
      case 'missingInbody':
        setDrawer({ title: '인바디 미업로드', visits: getTodayVisitsMissingInbody() });
        break;
      case 'missingPhoto':
        setDrawer({ title: '사진 미업로드', visits: getTodayVisitsMissingPhoto() });
        break;
      case 'print':
        showToast('보고서 출력 준비 중입니다.');
        window.setTimeout(() => window.print(), 300);
        break;
    }
  };

  const stats = getTodayStats();
  const progress = getProgressStats();
  const memos = getRecentMemos(3);
  const recentPatients = getRecentPatients(3);
  const todayVisits = getTodayVisits();
  const procedures = getProcedureTags();

  const formatTime = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const statItems = [
    { icon: Users, label: '전체 방문 환자', value: stats.totalVisits, unit: '명', color: 'text-gray-700' },
    { icon: UserPlus, label: '신규 등록', value: stats.newPatients, unit: '명', color: 'text-blue-600' },
    { icon: Camera, label: '사진 업로드 완료', value: stats.photoUploaded, unit: '명', color: 'text-green-600' },
    { icon: FileText, label: '인바디 업로드 완료', value: stats.inbodyUploaded, unit: '명', color: 'text-purple-600' },
    { icon: XCircle, label: '미완료 항목', value: stats.incomplete, unit: '명', color: 'text-red-500' },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <TopNav activeTab="dashboard" />

      <main className="max-w-[1440px] mx-auto px-6 py-5 space-y-5">
        {/* 3컬럼 동일 높이 — 각 컬럼 내부 flex로 빈 공간 제거 */}
        <div className="grid grid-cols-12 gap-5 items-stretch">
          {/* 왼쪽 */}
          <div className="col-span-3 flex flex-col gap-4">
            <StatCard onClick={() => setTodayInputOpen(true)} />
            <div className="panel-card p-5 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="panel-title">오늘 통계</h3>
                <span className="text-[10px] text-gray-400">{stats.date}</span>
              </div>
              <div className="space-y-2.5">
                {statItems.map((item, idx) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between py-0.5 ${idx > 0 ? 'section-divider pt-2.5' : ''}`}
                  >
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                      {item.label}
                    </span>
                    <span className={`font-bold text-base ${item.color}`}>
                      {item.value}
                      <span className="text-[10px] font-normal text-gray-400 ml-0.5">{item.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel-card p-5 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <h3 className="panel-title">최근 메모(3건)</h3>
                <button type="button" className="text-[10px] text-primary flex items-center gap-0.5 hover:underline">
                  더보기 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2 flex-1">
                {memos.map((m, idx) => (
                  <div
                    key={m.id}
                    className={`pb-2 last:pb-0 ${idx > 0 ? 'section-divider pt-2' : ''}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-0.5">
                      <span>{m.date}</span>
                      <span className="font-medium text-gray-700">{m.patientName}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{m.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 가운데 */}
          <div className="col-span-6 flex flex-col gap-4">
            <div className="flex-shrink-0">
              <h3 className="panel-title mb-3">최근 등록 환자 (3명)</h3>
              <div className="grid grid-cols-3 gap-4">
                {recentPatients.map((p) => {
                  const card = getRecentPatientCardData(p.id);
                  return (
                    <RecentPatientCard
                      key={p.id}
                      patient={card.patient}
                      visit={card.visit}
                      imageUrl={card.imageUrl}
                      weightKg={card.weightKg}
                      waistCm={card.waistCm}
                      bodyFatPct={card.bodyFatPct}
                    />
                  );
                })}
              </div>
            </div>
            <div id="today-visit-table" className="flex-1 min-h-0 flex">
              <TodayVisitTable visits={todayVisits} className="flex-1 min-h-0" />
            </div>
          </div>

          {/* 오른쪽 */}
          <div className="col-span-3 flex flex-col gap-4">
            <VisitCalendar />
            <ProgressDonut stats={progress} className="flex-1 min-h-0" />
          </div>
        </div>

        <ProcedureTagBar tags={procedures} />
        <ShortcutMenu onAction={handleShortcut} />

        <div className="flex items-center justify-end gap-2 text-xs text-gray-400">
          <RefreshCw className="w-3 h-3" />
          {formatTime(timestamp)}
        </div>
      </main>

      <TodayInputModal
        open={todayInputOpen}
        onClose={() => setTodayInputOpen(false)}
        onSuccess={(patientId) => {
          setRefreshKey((k) => k + 1);
          showToast('오늘 입력이 등록되었습니다.');
          navigate(`/patient/${patientId}`);
        }}
      />

      <VisitListDrawer
        open={drawer !== null}
        title={drawer?.title ?? ''}
        visits={drawer?.visits ?? []}
        onClose={() => setDrawer(null)}
      />
    </div>
  );
}
