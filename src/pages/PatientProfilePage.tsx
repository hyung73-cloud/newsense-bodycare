import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import TopNav from '../components/TopNav';
import PatientHeader from '../components/PatientHeader';
import PatientProfileTabs, { type PatientProfileTab } from '../components/PatientProfileTabs';
import KpiCard from '../components/KpiCard';
import MiniLineChart from '../components/MiniLineChart';
import PhotoCompareRow from '../components/PhotoCompareRow';
import InbodySummary from '../components/InbodySummary';
import ChangeChart from '../components/ChangeChart';
import ResearchPanel from '../components/ResearchPanel';
import VisitHistoryTable from '../components/VisitHistoryTable';
import VisitFormModal from '../components/VisitFormModal';
import type { Visit } from '../types';
import {
  getPatientById,
  getLatestVisit,
  getVisitsByPatientId,
  getVisitImages,
  getInbodyRecordsByPatient,
  getLatestInbody,
  getPatientVisitStats,
  getWeightChartData,
  getWaistChartData,
  getChangeChartData,
  getDoctorMemos,
  hideVisit,
  addVisitToday,
  updateVisit,
  hasVisitToday,
  TODAY,
  type VisitFormData,
} from '../api/mock';

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<PatientProfileTab>('summary');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingVisit, setEditingVisit] = useState<Visit | undefined>();

  const bump = () => setRefreshKey((k) => k + 1);
  void refreshKey;

  const patient = id ? getPatientById(id) : undefined;
  const visits = id ? getVisitsByPatientId(id) : [];
  const latestVisit = id ? getLatestVisit(id) : undefined;
  const stats = id && latestVisit ? getPatientVisitStats(id, latestVisit) : null;
  const inbodyRecords = id ? getInbodyRecordsByPatient(id) : [];
  const latestInbody = id ? getLatestInbody(id) : undefined;

  if (!patient) {
    return (
      <div className="min-h-screen bg-surface">
        <TopNav activeTab="manage" />
        <div className="max-w-[1440px] mx-auto px-6 py-20 text-center">
          <p className="text-gray-500 mb-4">환자를 찾을 수 없습니다.</p>
          <Link to="/" className="text-primary hover:underline">
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const firstVisit = visits[0];
  const prevVisit = visits.length >= 2 ? visits[visits.length - 2] : undefined;

  const frontSlots = firstVisit && latestVisit
    ? [
        {
          label: '최초',
          labelColor: 'bg-gray-500 text-white',
          image: getVisitImages(firstVisit.id, 'front'),
          date: firstVisit.date,
        },
        {
          label: '이전',
          labelColor: 'bg-blue-500 text-white',
          image: prevVisit ? getVisitImages(prevVisit.id, 'front') : undefined,
          date: prevVisit?.date,
        },
        {
          label: '최신',
          labelColor: 'bg-green-500 text-white',
          image: getVisitImages(latestVisit.id, 'front'),
          date: latestVisit.date,
        },
      ]
    : [];

  const sideSlots = firstVisit && latestVisit
    ? [
        {
          label: '최초',
          labelColor: 'bg-gray-500 text-white',
          image: getVisitImages(firstVisit.id, 'side'),
          date: firstVisit.date,
        },
        {
          label: '이전',
          labelColor: 'bg-blue-500 text-white',
          image: prevVisit ? getVisitImages(prevVisit.id, 'side') : undefined,
          date: prevVisit?.date,
        },
        {
          label: '최신',
          labelColor: 'bg-green-500 text-white',
          image: getVisitImages(latestVisit.id, 'side'),
          date: latestVisit.date,
        },
      ]
    : [];

  const researchItems = latestInbody
    ? [
        {
          label: '기초대사량',
          value: `${latestInbody.bmrKcal} kcal`,
          range: '1303 ~ 1510',
        },
        {
          label: '복부지방률',
          value: `${latestInbody.abdominalFatRatio}`,
          range: '0.75 ~ 0.85',
        },
        {
          label: '내장지방레벨',
          value: `${latestInbody.visceralLevel}`,
          range: '1 ~ 9',
          highlight: latestInbody.visceralLevel > 9,
        },
        {
          label: 'SMI',
          value: `${latestInbody.smi} kg/m²`,
          range: '7.0 ~ 9.0',
        },
      ]
    : [];

  const openAddModal = () => {
    if (id && hasVisitToday(id)) {
      const todayVisit = visits.find((v) => v.date === TODAY);
      if (todayVisit) {
        openEditModal(todayVisit);
        return;
      }
    }
    setModalMode('add');
    setEditingVisit(undefined);
    setModalOpen(true);
  };

  const openEditModal = (visit: Visit) => {
    setModalMode('edit');
    setEditingVisit(visit);
    setModalOpen(true);
  };

  const handleSave = (data: VisitFormData) => {
    if (!id) return;
    if (modalMode === 'add') {
      addVisitToday(id, data);
      setActiveTab('records');
    } else if (editingVisit) {
      updateVisit(editingVisit.id, data);
    }
    bump();
  };

  const handleDelete = (visit: Visit) => {
    if (!window.confirm(`${visit.date.replace(/-/g, '.')} 기록을 삭제(숨김)하시겠습니까?`)) return;
    hideVisit(visit.id);
    bump();
  };

  const handleDeleteLatest = () => {
    if (latestVisit) handleDelete(latestVisit);
  };

  return (
    <div className="min-h-screen bg-surface">
      <TopNav activeTab="manage" />

      <main className="max-w-[1440px] mx-auto px-6 py-6 space-y-5">
        <PatientHeader patient={patient} onAddRecord={openAddModal} />

        <PatientProfileTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === 'summary' && (
          <>
            {latestVisit ? (
              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-3 space-y-4">
                  <h3 className="font-bold text-gray-900 text-sm">핵심 지표 (최근 방문 기준)</h3>
                  {stats && (
                    <>
                      <KpiCard
                        title="체지방률"
                        value={latestVisit.bodyFatPct.toFixed(1)}
                        unit="%"
                        change={parseFloat(stats.bodyFatChange.toFixed(1))}
                        changeUnit="%"
                        status="표준이하"
                        icon="fat"
                        positiveIsGood
                      />
                      <KpiCard
                        title="골격근량"
                        value={latestVisit.skeletalMuscleKg.toFixed(1)}
                        unit="kg"
                        change={parseFloat(stats.muscleChange.toFixed(1))}
                        changeUnit="kg"
                        status="표준이상"
                        icon="muscle"
                        positiveIsGood={false}
                      />
                      <KpiCard
                        title="내장지방레벨"
                        value={`${latestVisit.visceralLevel}`}
                        unit=""
                        change={stats.visceralChange}
                        changeUnit=""
                        status="복부비만"
                        icon="visceral"
                        positiveIsGood
                      />
                    </>
                  )}

                  <MiniLineChart
                    title="체중 변화"
                    data={getWeightChartData(patient.id)}
                    color="#2563EB"
                    unit="kg"
                  />
                  <MiniLineChart
                    title="허리둘레 변화"
                    data={getWaistChartData(patient.id)}
                    color="#A855F7"
                    unit="cm"
                  />

                  <div className="bg-white rounded-card shadow-card p-4">
                    <h4 className="text-xs font-bold text-gray-700 mb-3">의사 메모 (최근)</h4>
                    <div className="space-y-3">
                      {getDoctorMemos(patient.id, 3).map((m) => (
                        <div key={m.date} className="border-b border-gray-50 pb-2 last:border-0">
                          <div className="text-[10px] text-gray-400">{m.date}</div>
                          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{m.note}</p>
                        </div>
                      ))}
                      {getDoctorMemos(patient.id, 3).length === 0 && (
                        <p className="text-xs text-gray-400">메모 없음</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-span-9">
                  <div className="bg-white rounded-card shadow-card p-5">
                    <h3 className="font-bold text-gray-900 mb-4">최근 변화 요약</h3>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <SummaryStat label="체중" value={`${latestVisit.weightKg} kg`} />
                      <SummaryStat label="허리둘레" value={`${latestVisit.waistCm} cm`} />
                      <SummaryStat label="체지방률" value={`${latestVisit.bodyFatPct}%`} />
                      <SummaryStat label="골격근량" value={`${latestVisit.skeletalMuscleKg} kg`} />
                    </div>
                    <ChangeChart data={getChangeChartData(patient.id)} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-card shadow-card p-12 text-center">
                <p className="text-gray-500 mb-4">방문 기록이 없습니다.</p>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="text-sm text-primary border border-primary px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  오늘 기록 추가하기
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'records' && (
          <VisitHistoryTable
            visits={visits}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        )}

        {activeTab === 'photos' && (
          <>
            {latestVisit ? (
              <div className="bg-white rounded-card shadow-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">체형 사진 비교 (허리 중심 8cm 범위)</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      눈금 단위: cm · 0 = 배꼽 중심 · 고정 SVG 가이드 오버레이
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-gray-500" /> 최초
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-blue-500" /> 이전
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-green-500" /> 최신
                      </span>
                    </div>
                  </div>
                </div>

                <PhotoCompareRow title="정면" slots={frontSlots} />
                <PhotoCompareRow title="측면" slots={sideSlots} />

                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-2 mt-4">
                  📷 촬영 가이드: 배꼽이 눈금자 0 위치에 오도록 서서 촬영합니다. (자동정렬 미구현 — 고정 가이드만 표시)
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-card shadow-card p-12 text-center text-gray-500 text-sm">
                사진 비교를 표시할 방문 기록이 없습니다.
              </div>
            )}
          </>
        )}

        {activeTab === 'inbody' && (
          <div className="grid grid-cols-3 gap-5">
            <InbodySummary records={inbodyRecords} />
            <ChangeChart data={getChangeChartData(patient.id)} />
            <ResearchPanel items={researchItems} />
          </div>
        )}

        {latestVisit && (
          <div className="flex items-center justify-between bg-white rounded-card shadow-card px-5 py-3">
            <div className="text-xs text-gray-400">
              입력자: {latestVisit.enteredBy} · 입력일시: {latestVisit.enteredAt}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => openEditModal(latestVisit)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                기록 수정
              </button>
              <button
                type="button"
                onClick={handleDeleteLatest}
                className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600"
              >
                기록 삭제
              </button>
            </div>
          </div>
        )}
      </main>

      <VisitFormModal
        open={modalOpen}
        mode={modalMode}
        initial={editingVisit}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-lg font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}
