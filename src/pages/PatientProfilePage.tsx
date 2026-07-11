import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import TopNav from '../components/TopNav';
import PatientHeader from '../components/PatientHeader';
import PatientProfileTabs, { type PatientProfileTab } from '../components/PatientProfileTabs';
import KpiCard from '../components/KpiCard';
import MiniLineChart from '../components/MiniLineChart';
import { PhotoComparePair } from '../components/PhotoCompareRow';
import InbodySummary from '../components/InbodySummary';
import ChangeChart from '../components/ChangeChart';
import ResearchPanel from '../components/ResearchPanel';
import VisitHistoryTable from '../components/VisitHistoryTable';
import VisitFormModal from '../components/VisitFormModal';
import AbdomenChart from '../components/AbdomenChart';
import InbodyUploadModal, { type InbodyUploadPayload } from '../components/InbodyUploadModal';
import { useToast } from '../context/ToastContext';
import type { Visit, ImageType } from '../types';
import {
  getPatientById,
  getLatestVisit,
  getVisitsByPatientId,
  getVisitImages,
  getPhotoCompareSlots,
  getInbodyRecordsByPatient,
  getLatestInbody,
  getLatestBodyShape,
  getPatientVisitStats,
  getWeightChartData,
  getWaistChartData,
  getChangeChartData,
  getAbdomenChartData,
  getDoctorMemos,
  hideVisit,
  addVisitToday,
  updateVisit,
  hasVisitToday,
  setVisitPhotoFile,
  ensureTodayVisitForPhoto,
  ensurePrevVisitForPhoto,
  clearPatientBodyPhotos,
  setInbodySheetFile,
  setBodyShapeSheetFile,
  applyInbodyOcrData,
  applyBodyShapeOcrData,
  isInbodyOcrEnabledForPatient,
  TODAY,
  type VisitFormData,
} from '../api/mock';

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<PatientProfileTab>('summary');
  const [modalOpen, setModalOpen] = useState(false);
  const [inbodyModalOpen, setInbodyModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingVisit, setEditingVisit] = useState<Visit | undefined>();

  const { showToast } = useToast();

  const bump = () => setRefreshKey((k) => k + 1);
  void refreshKey;

  const patient = id ? getPatientById(id) : undefined;
  const visits = id ? getVisitsByPatientId(id) : [];
  const latestVisit = id ? getLatestVisit(id) : undefined;
  const stats = id && latestVisit ? getPatientVisitStats(id, latestVisit) : null;
  const inbodyRecords = id ? getInbodyRecordsByPatient(id) : [];
  const latestInbody = id ? getLatestInbody(id) : undefined;
  const latestBodyShape = id ? getLatestBodyShape(id) : undefined;

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

  const frontCompare = id ? getPhotoCompareSlots(id, 'front') : {};
  const sideCompare = id ? getPhotoCompareSlots(id, 'side') : {};

  const toDotDate = (date?: string) => (date ? date.replace(/-/g, '.') : undefined);

  const frontSlots = [
    {
      label: '그전',
      labelColor: 'bg-blue-500 text-white',
      image: frontCompare.prev?.image,
      date: toDotDate(frontCompare.prev?.date),
    },
    {
      label: '오늘',
      labelColor: 'bg-green-500 text-white',
      image: frontCompare.today?.image,
      date: toDotDate(frontCompare.today?.date ?? TODAY),
    },
  ];

  const sideSlots = [
    {
      label: '그전',
      labelColor: 'bg-blue-500 text-white',
      image: sideCompare.prev?.image,
      date: toDotDate(sideCompare.prev?.date),
    },
    {
      label: '오늘',
      labelColor: 'bg-green-500 text-white',
      image: sideCompare.today?.image,
      date: toDotDate(sideCompare.today?.date ?? TODAY),
    },
  ];

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

  const handleSave = async (data: VisitFormData) => {
    if (!id) return;
    try {
      if (modalMode === 'add') {
        await addVisitToday(id, data);
        setActiveTab('records');
        showToast('오늘 기록이 서버에 저장되었습니다.');
      } else if (editingVisit) {
        await updateVisit(editingVisit.id, data);
        showToast('기록이 서버에 저장되었습니다.');
      }
      bump();
    } catch (err) {
      bump();
      showToast(err instanceof Error ? err.message : '서버 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleDelete = async (visit: Visit) => {
    if (!window.confirm(`${visit.date.replace(/-/g, '.')} 기록을 삭제(숨김)하시겠습니까?`)) return;
    try {
      await hideVisit(visit.id);
      bump();
      showToast('기록이 서버에서 숨김 처리되었습니다.');
    } catch (err) {
      bump();
      showToast(err instanceof Error ? err.message : '삭제 저장에 실패했습니다.');
    }
  };

  const handleDeleteLatest = () => {
    if (latestVisit) handleDelete(latestVisit);
  };

  const handlePhotoUpload = async (
    type: ImageType,
    file: File,
    slot: 'prev' | 'today' = 'today',
  ) => {
    if (!id) return;
    try {
      const visit =
        slot === 'prev' ? await ensurePrevVisitForPhoto(id) : await ensureTodayVisitForPhoto(id);
      await setVisitPhotoFile(visit.id, type === 'front' || type === 'side' ? type : 'front', file);
      bump();
      const slotLabel = slot === 'prev' ? '그전' : '오늘';
      showToast(
        `${slotLabel} ${type === 'front' ? '정면' : '측면'} 사진이 저장되었습니다 (${visit.date.replace(/-/g, '.')}).`,
      );
    } catch (err) {
      bump();
      showToast(err instanceof Error ? err.message : '사진 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleClearPhotos = async () => {
    if (!id) return;
    if (!window.confirm('이 환자의 체형 사진(정면/측면)을 모두 삭제할까요? 다시 올릴 수 있습니다.')) return;
    try {
      await clearPatientBodyPhotos(id);
      bump();
      showToast('체형 사진을 모두 지웠습니다. 그전/오늘 버튼을 눌러 다시 올려주세요.');
    } catch (err) {
      bump();
      showToast(err instanceof Error ? err.message : '사진 삭제에 실패했습니다.');
    }
  };

  const handleInbodyUpload = async ({
    inbodyFile,
    inbodyParsed,
    applyInbodyOcr,
    bodyShapeFile,
    bodyShapeParsed,
    applyBodyShapeOcr,
  }: InbodyUploadPayload) => {
    if (!latestVisit || !id) {
      throw new Error('오늘 방문 기록이 없어 업로드할 수 없습니다.');
    }
    if (applyInbodyOcr && inbodyParsed) {
      await applyInbodyOcrData(id, latestVisit.id, inbodyParsed);
    }
    if (applyBodyShapeOcr && bodyShapeParsed) {
      await applyBodyShapeOcrData(latestVisit.id, bodyShapeParsed);
    }
    if (inbodyFile) {
      await setInbodySheetFile(latestVisit.id, inbodyFile);
    }
    if (bodyShapeFile) {
      await setBodyShapeSheetFile(latestVisit.id, bodyShapeFile);
    }
    setInbodyModalOpen(false);
    bump();
    if ((applyInbodyOcr && inbodyParsed) || (applyBodyShapeOcr && bodyShapeParsed)) {
      showToast('기록지 저장 및 OCR 자동입력이 완료되었습니다.');
    } else {
      showToast('기록지가 서버에 저장되었습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <TopNav activeTab="manage" />

      <main className="max-w-[1440px] mx-auto px-6 py-6 space-y-5">
        <PatientHeader
          patient={patient}
          avatarUrl={latestVisit ? getVisitImages(latestVisit.id, 'front')?.url : undefined}
          onAddRecord={openAddModal}
          onInbodyUpload={() => setInbodyModalOpen(true)}
          onPhotoUpload={handlePhotoUpload}
          onClearPhotos={handleClearPhotos}
        />

        <PatientProfileTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === 'summary' && (
          <>
            {latestVisit ? (
              <div className="space-y-5">
              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-3 flex flex-col gap-4">
                  <h3 className="section-label">핵심 지표 (최근 방문 기준)</h3>
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

                  <div className="panel-card p-4 flex-1">
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
                  <div className="panel-card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="panel-title">체형 사진 비교 (허리 중심 8cm 범위)</h3>
                        <p className="text-xs text-gray-400 mt-1">
                          눈금 단위: cm · 0 = 배꼽 중심 · 고정 SVG 가이드 오버레이
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <span className="legend-pill">
                          <span className="w-2 h-2 rounded-full bg-blue-500" /> 그전
                        </span>
                        <span className="legend-pill">
                          <span className="w-2 h-2 rounded-full bg-green-500" /> 오늘
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('photos')}
                          className="text-xs text-primary hover:underline font-medium ml-1"
                        >
                          사진 전체 보기 →
                        </button>
                      </div>
                    </div>

                    <PhotoComparePair frontSlots={frontSlots} sideSlots={sideSlots} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5 items-stretch">
                <InbodySummary
                  records={inbodyRecords}
                  bodyShapeSheetUrl={latestBodyShape?.sheetImageUrl}
                />
                <ChangeChart data={getChangeChartData(patient.id)} />
                <AbdomenChart data={getAbdomenChartData(patient.id)} />
              </div>
              </div>
            ) : (
              <div className="panel-card p-12 text-center">
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
              <div className="panel-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="panel-title">체형 사진 비교 (허리 중심 8cm 범위)</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      눈금 단위: cm · 0 = 배꼽 중심 · 고정 SVG 가이드 오버레이
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className="legend-pill">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> 그전
                    </span>
                    <span className="legend-pill">
                      <span className="w-2 h-2 rounded-full bg-green-500" /> 오늘
                    </span>
                  </div>
                </div>

                <PhotoComparePair frontSlots={frontSlots} sideSlots={sideSlots} />

                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-2 mt-4">
                  📷 촬영 가이드: 배꼽이 눈금자 0 위치에 오도록 서서 촬영합니다. (자동정렬 미구현 — 고정 가이드만 표시)
                  <br />
                  <span className="text-gray-400">※ 임시 업로드입니다. 새로고침 시 초기화됩니다.</span>
                </p>
              </div>
            ) : (
              <div className="panel-card p-12 text-center text-gray-500 text-sm">
                사진 비교를 표시할 방문 기록이 없습니다.
              </div>
            )}
          </>
        )}

        {activeTab === 'inbody' && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-5 items-stretch">
              <InbodySummary
                records={inbodyRecords}
                bodyShapeSheetUrl={latestBodyShape?.sheetImageUrl}
              />
              <ChangeChart data={getChangeChartData(patient.id)} />
              <ResearchPanel items={researchItems} />
            </div>
            <AbdomenChart data={getAbdomenChartData(patient.id)} />
          </div>
        )}

        {latestVisit && (
          <div className="flex items-center justify-between panel-card px-5 py-3">
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

      <InbodyUploadModal
        open={inbodyModalOpen}
        patientName={patient.name}
        chartNo={patient.chartNo}
        ocrEnabled={isInbodyOcrEnabledForPatient(patient)}
        onClose={() => setInbodyModalOpen(false)}
        onUpload={handleInbodyUpload}
      />
    </div>
  );
}
