import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { registerPackageToday } from '../api/mock';
import PackageConsultModal from '../components/PackageConsultModal';
import {
  Activity,
  ClipboardCheck,
  TrendingUp,
  UserRound,
  ShieldCheck,
  Check,
  Scale,
  HeartPulse,
  Camera,
  Droplets,
  Sparkles,
  Syringe,
  Waves,
  ChevronLeft,
  ChevronRight,
  X,
  Gem,
  Ticket,
  UserPlus,
  Printer,
  CalendarClock,
} from 'lucide-react';

/* ── 데이터 ── */

interface Level {
  key: string;
  badge: string;
  name: string;
  subtitle: string;
  price: number;
  color: string;
  ring: string;
  chip: string;
  icon: typeof Scale;
  features: string[];
}

interface ProcedureOption {
  key: string;
  name: string;
  price1: number;
  price3: number;
  icon: typeof Droplets;
  hasAreaSelect?: boolean;
}

interface ProcedureCategory {
  key: string;
  title: string;
  items: ProcedureOption[];
}

interface FocusedOption {
  key: string;
  name: string;
  price: number;
}

interface PlusOption {
  key: string;
  name: string;
  price: number;
  description: string;
}

const LEVELS: Level[] = [
  {
    key: 'basic',
    badge: 'LEVEL 1',
    name: '2회진료권',
    subtitle: '체중관리',
    price: 35000,
    color: 'text-green-600',
    ring: 'ring-green-500 border-green-500',
    chip: 'bg-green-50 text-green-700',
    icon: Scale,
    features: ['인바디', '맞춤처방', '생활습관 가이드', '씨앤유 처방'],
  },
  {
    key: 'standard',
    badge: 'LEVEL 2',
    name: '5회진료권',
    subtitle: '건강관리',
    price: 85000,
    color: 'text-blue-600',
    ring: 'ring-blue-500 border-blue-500',
    chip: 'bg-blue-50 text-blue-700',
    icon: HeartPulse,
    features: ['2회진료권 전체 포함', '허리둘레 측정', '악력(근력)측정', '당화혈색소 검사'],
  },
  {
    key: 'premium',
    badge: 'LEVEL 3',
    name: '8회진료권',
    subtitle: '체형관리',
    price: 170000,
    color: 'text-purple-600',
    ring: 'ring-purple-500 border-purple-500',
    chip: 'bg-purple-50 text-purple-700',
    icon: Camera,
    features: ['5회진료권 전체 포함', '카복시 관리(4회)', 'HPL(+5)', '체형사진(+1)'],
  },
];

const PROCEDURE_CATEGORIES: ProcedureCategory[] = [
  {
    key: 'circulation',
    title: '순환 · 회복',
    items: [
      { key: 'arginine', name: '아르기닌 수액', price1: 70000, price3: 200000, icon: Droplets },
      { key: 'vlipo', name: '브이리포', price1: 80000, price3: 200000, icon: Waves },
      { key: 'syneson', name: '시네손', price1: 50000, price3: 130000, icon: Sparkles },
    ],
  },
  {
    key: 'fat',
    title: '지방분해',
    items: [
      { key: 'hpl-abdomen', name: '복부 HPL', price1: 150000, price3: 400000, icon: Syringe },
      { key: 'hpl-partial', name: '부분 HPL', price1: 60000, price3: 150000, icon: Syringe, hasAreaSelect: true },
    ],
  },
];

const PARTIAL_AREAS = ['팔뚝', '등', '옆가슴', '부유방'];

const FOCUSED_OPTIONS: FocusedOption[] = [
  { key: 'carboxy-1', name: '카복시 1회', price: 30000 },
  { key: 'carboxy-4', name: '카복시 4회', price: 100000 },
  { key: 'carboxy-unlimited', name: '카복시 무제한(월)', price: 150000 },
  { key: 'lipoderm', name: '리포덤', price: 50000 },
  { key: 'lipoderm-hpl', name: 'HPL 동시 시술 시 리포덤', price: 30000 },
];

const PLUS_OPTIONS: PlusOption[] = [
  { key: 'plus-20', name: 'Plus 20', price: 200000, description: '눈밑지방(RF/리바이브)' },
  { key: 'plus-50', name: 'Plus 50', price: 500000, description: '눈밑/볼관자/팔자주름 필러' },
  { key: 'plus-90', name: 'Plus 90', price: 900000, description: '눈밑/볼관자/팔자/탄력/피부처짐' },
];

const PLUS_USABLE = ['보톡스', '필러', '레이저', '피부관리', '비만시술', '리프팅', '탄력관리', '색소관리'];

const FEATURES = [
  { icon: ClipboardCheck, title: '정확한 측정', desc: '인바디 · 허리둘레 · 체형사진' },
  { icon: TrendingUp, title: '변화 기록', desc: '그래프 · 리포트로 확인' },
  { icon: UserRound, title: '맞춤 관리', desc: '의사 상담 · 맞춤 처방' },
  { icon: ShieldCheck, title: '안전한 관리', desc: '검증된 시술 · 체계적 관리' },
];

const STEPS = [
  { n: 1, label: '레벨 선택' },
  { n: 2, label: '시술 추가' },
  { n: 3, label: 'Plus & 확인' },
];

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

/* ── 선택 상태 타입 ── */

interface ProcSelection {
  key: string;
  name: string;
  freq: '1' | '3';
  price: number;
  areas?: string[];
}

interface FocusedSelection {
  key: string;
  name: string;
  price: number;
}

/* ── 컴포넌트 ── */

export default function PackageSelectPage() {
  const [step, setStep] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [procSelections, setProcSelections] = useState<ProcSelection[]>([]);
  const [focusedSelection, setFocusedSelection] = useState<FocusedSelection | null>(null);
  const [selectedPlus, setSelectedPlus] = useState<string | null>(null);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [chartNo, setChartNo] = useState('');
  const [issued, setIssued] = useState(false);

  const level = LEVELS.find((l) => l.key === selectedLevel) ?? null;
  const isPremium = selectedLevel === 'premium';
  const plusOption = PLUS_OPTIONS.find((p) => p.key === selectedPlus) ?? null;

  const { procedureTotal, plusTotal, total } = useMemo(() => {
    const procTotal = procSelections.reduce((s, p) => s + p.price, 0) + (focusedSelection?.price ?? 0);
    const pTotal = plusOption?.price ?? 0;
    return {
      procedureTotal: procTotal,
      plusTotal: pTotal,
      total: (level?.price ?? 0) + procTotal + pTotal,
    };
  }, [level, procSelections, focusedSelection, plusOption]);

  // 발급될 티켓(시술권) 목록 구성
  const tickets = useMemo(() => {
    const list: { label: string; sub?: string; price: number; kind: 'level' | 'proc' | 'focused' | 'plus' }[] = [];
    if (level) list.push({ label: `${level.name} · ${level.subtitle}`, sub: '패키지', price: level.price, kind: 'level' });
    procSelections.forEach((p) => {
      const areaText = p.areas && p.areas.length > 0 ? ` · ${p.areas.join(', ')}` : '';
      list.push({ label: `${p.name} ${p.freq}회권${areaText}`, sub: '시술권', price: p.price, kind: 'proc' });
    });
    if (focusedSelection) list.push({ label: focusedSelection.name, sub: '집중시술권', price: focusedSelection.price, kind: 'focused' });
    if (plusOption) list.push({ label: `${plusOption.name} 충전권`, sub: 'Plus 충전', price: plusOption.price, kind: 'plus' });
    return list;
  }, [level, procSelections, focusedSelection, plusOption]);

  const packageSummary = useMemo(() => tickets.map((t) => t.label).join(', '), [tickets]);

  const openPatientModal = () => {
    setPatientName('');
    setChartNo('');
    setPatientModalOpen(true);
  };

  const confirmPatient = async () => {
    if (!patientName.trim() || !chartNo.trim() || !level) return;
    const itemLabels = tickets.map((t) => t.label).join(', ');
    try {
      await registerPackageToday({
        name: patientName.trim(),
        chartNo: chartNo.trim(),
        packageName: `${level.name} · ${level.subtitle}`,
        packageDetail: itemLabels,
        packagePrice: total,
        packageTickets: tickets.map(({ label, sub, price }) => ({ label, sub, price })),
      });
      setPatientModalOpen(false);
      setIssued(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '서버 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const resetAll = () => {
    setIssued(false);
    setStep(1);
    setSelectedLevel(null);
    setProcSelections([]);
    setFocusedSelection(null);
    setSelectedPlus(null);
    setPatientName('');
    setChartNo('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isProcSelected = (key: string) => procSelections.some((p) => p.key === key);
  const getProcFreq = (key: string): '1' | '3' | null => {
    const found = procSelections.find((p) => p.key === key);
    return found ? found.freq : null;
  };
  const getProcAreas = (key: string): string[] => {
    return procSelections.find((p) => p.key === key)?.areas ?? [];
  };

  const toggleProcedure = (item: ProcedureOption, freq: '1' | '3') => {
    setProcSelections((prev) => {
      const existing = prev.find((p) => p.key === item.key);
      if (existing && existing.freq === freq) {
        return prev.filter((p) => p.key !== item.key);
      }
      const price = freq === '1' ? item.price1 : item.price3;
      const filtered = prev.filter((p) => p.key !== item.key);
      return [...filtered, { key: item.key, name: item.name, freq, price, areas: existing?.areas }];
    });
  };

  const toggleArea = (procKey: string, area: string) => {
    setProcSelections((prev) =>
      prev.map((p) => {
        if (p.key !== procKey) return p;
        const areas = p.areas ?? [];
        const next = areas.includes(area) ? areas.filter((a) => a !== area) : [...areas, area];
        return { ...p, areas: next };
      }),
    );
  };

  const toggleFocused = (opt: FocusedOption) => {
    setFocusedSelection((prev) => (prev?.key === opt.key ? null : { key: opt.key, name: opt.name, price: opt.price }));
  };

  const goNext = () => {
    setStep((s) => Math.min(3, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goPrev = () => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLevelSelect = (key: string) => {
    setSelectedLevel(key);
    if (key !== 'premium') setSelectedPlus(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28 md:pb-12">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5 group" title="홈으로 이동">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors">
                NewSense BodyCare
              </div>
              <div className="text-[11px] text-gray-500 leading-tight">체중 · 건강 · 체형 통합관리 프로그램</div>
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4">
        {issued ? (
          /* ── 티켓(시술권) 발급 결과 ── */
          <div className="py-6 animate-in fade-in duration-300">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-extrabold text-gray-900">패키지 등록 완료</h1>
              <p className="text-sm text-gray-500 mt-1">아래 상품(시술권)이 발급되었습니다.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* 환자 정보 */}
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-gray-400">환자</div>
                  <div className="font-bold text-gray-900">{patientName}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-gray-400">차트번호</div>
                  <div className="font-bold text-gray-900">{chartNo}</div>
                </div>
              </div>

              {/* 티켓 목록 */}
              <ul className="divide-y divide-gray-50">
                {tickets.map((t, i) => (
                  <li key={i} className="px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <Ticket className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{t.label}</div>
                        {t.sub && <div className="text-[11px] text-gray-400">{t.sub}</div>}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{won(t.price)}</span>
                  </li>
                ))}
              </ul>

              {/* 합계 */}
              <div className="px-5 py-4 bg-primary/5 flex items-center justify-between">
                <span className="font-bold text-gray-900">합계 ({tickets.length}건)</span>
                <span className="text-xl font-extrabold text-primary">{won(total)}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50"
              >
                <Printer className="w-4 h-4" /> 인쇄
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-700"
              >
                새 패키지 등록
              </button>
            </div>
          </div>
        ) : (
        <>
        {/* 스텝 인디케이터 */}
        <div className="py-5">
          <div className="flex items-center">
            {STEPS.map((s, i) => {
              const done = step > s.n;
              const active = step === s.n;
              return (
                <div key={s.n} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        done ? 'bg-primary text-white' : active ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" /> : s.n}
                    </div>
                    <span className={`text-[11px] mt-1 whitespace-nowrap ${active ? 'text-primary font-bold' : 'text-gray-400'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 -mt-4 ${step > s.n ? 'bg-primary' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── STEP 1: 레벨 선택 ── */}
        {step === 1 && (
          <div className="animate-in fade-in duration-300">
            <section className="text-center mb-6">
              <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-snug">
                기존의 단순한 처방과 구매를 넘어,
                <br />
                <span className="text-primary">적극적인 관리 프로그램</span>을 추천드립니다.
              </h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-5">
                {FEATURES.map((f) => (
                  <div key={f.title} className="bg-white rounded-xl p-3 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1.5">
                      <f.icon className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-gray-800">{f.title}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{f.desc}</div>
                  </div>
                ))}
              </div>
            </section>

            <h2 className="text-lg font-bold text-gray-900">관리 레벨을 선택하세요</h2>
            <p className="text-xs text-gray-500 mt-1 mb-4">패키지에 포함되는 항목을 확인하고 선택해주세요.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LEVELS.map((lv) => {
                const active = selectedLevel === lv.key;
                return (
                  <button
                    key={lv.key}
                    type="button"
                    onClick={() => handleLevelSelect(lv.key)}
                    className={`text-left bg-white rounded-2xl border p-5 transition-all shadow-sm ${
                      active ? `ring-2 ${lv.ring}` : 'border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${lv.chip}`}>{lv.badge}</span>
                      <lv.icon className={`w-6 h-6 ${lv.color}`} />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xl font-extrabold ${lv.color}`}>{lv.name}</span>
                      <span className="text-sm font-medium text-gray-500">{lv.subtitle}</span>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {lv.features.map((ft) => (
                        <li key={ft} className="flex items-start gap-2 text-xs text-gray-600">
                          <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${lv.color}`} />
                          <span>{ft}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-gray-400">패키지 가격</div>
                        <span className={`text-lg font-extrabold ${lv.color}`}>{won(lv.price)}</span>
                      </div>
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${active ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                        {active && <Check className="w-4 h-4 text-white" />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 2: 시술 추가 ── */}
        {step === 2 && (
          <div className="animate-in fade-in duration-300 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">필요한 시술을 추가하세요</h2>
              <p className="text-xs text-gray-500 mt-1">원하는 시술과 횟수를 선택하세요. (선택 사항)</p>
            </div>

            {PROCEDURE_CATEGORIES.map((cat) => (
              <div key={cat.key} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800">{cat.title}</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {cat.items.map((item) => {
                    const selected = isProcSelected(item.key);
                    const freq = getProcFreq(item.key);
                    const areas = getProcAreas(item.key);
                    return (
                      <div key={item.key} className={`p-4 ${selected ? 'bg-primary/5' : ''}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <item.icon className={`w-5 h-5 ${selected ? 'text-primary' : 'text-gray-400'}`} />
                          <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => toggleProcedure(item, '1')}
                            className={`py-2.5 px-3 rounded-xl border text-sm transition-all ${
                              freq === '1' ? 'border-primary bg-primary text-white font-bold' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-[11px] opacity-80">1회</div>
                            <div className="font-bold">{won(item.price1)}</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleProcedure(item, '3')}
                            className={`py-2.5 px-3 rounded-xl border text-sm transition-all ${
                              freq === '3' ? 'border-primary bg-primary text-white font-bold' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-[11px] opacity-80">3회</div>
                            <div className="font-bold">{won(item.price3)}</div>
                          </button>
                        </div>
                        {item.hasAreaSelect && selected && (
                          <div className="mt-3">
                            <div className="text-[11px] text-gray-500 mb-2">부분 선택 (동일 가격)</div>
                            <div className="flex flex-wrap gap-2">
                              {PARTIAL_AREAS.map((area) => (
                                <button
                                  key={area}
                                  type="button"
                                  onClick={() => toggleArea(item.key, area)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                    areas.includes(area) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  {area}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* 집중시술관리 */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-800">집중시술관리</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {FOCUSED_OPTIONS.map((opt) => {
                  const active = focusedSelection?.key === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => toggleFocused(opt)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors ${active ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center border ${active ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                          {active && <Check className="w-3.5 h-3.5" />}
                        </span>
                        <span className={`text-sm ${active ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{opt.name}</span>
                      </span>
                      <span className={`text-sm font-bold ${active ? 'text-primary' : 'text-gray-600'}`}>{won(opt.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">추가 시술 비용</span>
              <span className="font-bold text-gray-900">{won(procedureTotal)}</span>
            </div>
          </div>
        )}

        {/* ── STEP 3: Plus & 확인 ── */}
        {step === 3 && (
          <div className="animate-in fade-in duration-300 space-y-6">
            {/* Plus 프로그램 (Premium만) */}
            {isPremium ? (
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Gem className="w-5 h-5 text-amber-600" />
                  Plus 프로그램
                </h2>
                <p className="text-xs text-gray-500 mt-1 mb-4">원하는 만큼 충전하여 다양한 시술에 사용하세요.</p>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {PLUS_OPTIONS.map((opt) => {
                    const active = selectedPlus === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setSelectedPlus(active ? null : opt.key)}
                        className={`text-center rounded-2xl border p-4 transition-all ${
                          active ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50' : 'border-gray-100 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-amber-700 mb-1">{opt.name}</div>
                        <div className={`text-lg font-extrabold ${active ? 'text-amber-700' : 'text-gray-900'}`}>{won(opt.price)}</div>
                        <div className="text-[11px] leading-4 text-gray-500 mt-2 break-keep">{opt.description}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="text-xs font-bold text-gray-500 mb-2">사용 가능 시술</div>
                  <div className="flex flex-wrap gap-2">
                    {PLUS_USABLE.map((item) => (
                      <span key={item} className="text-xs bg-gray-50 text-gray-600 border border-gray-200 rounded-full px-2.5 py-1">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">
                  Plus 프로그램은 <strong className="text-purple-600">8회진료권 · 체형관리</strong> 선택 시 이용 가능합니다.
                </p>
              </div>
            )}

            {/* 최종 확인 */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">선택 내용 확인</h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="text-xs font-bold text-gray-400 mb-2">관리 레벨 (월)</div>
                  {level ? (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <level.icon className={`w-5 h-5 ${level.color}`} />
                        <span className="font-bold text-gray-900">{level.name} · {level.subtitle}</span>
                      </span>
                      <span className="font-bold">{won(level.price)}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-red-500">미선택</p>
                  )}
                </div>

                {procSelections.length > 0 && (
                  <div className="p-4 border-b border-gray-100">
                    <div className="text-xs font-bold text-gray-400 mb-2">추가 시술</div>
                    <ul className="space-y-1.5">
                      {procSelections.map((p) => (
                        <li key={p.key} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">
                            {p.name} ({p.freq}회)
                            {p.areas && p.areas.length > 0 && <span className="text-gray-400 ml-1">· {p.areas.join(', ')}</span>}
                          </span>
                          <span className="text-gray-700">{won(p.price)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {focusedSelection && (
                  <div className="p-4 border-b border-gray-100">
                    <div className="text-xs font-bold text-gray-400 mb-2">집중시술</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{focusedSelection.name}</span>
                      <span className="text-gray-700">{won(focusedSelection.price)}</span>
                    </div>
                  </div>
                )}

                {plusOption && (
                  <div className="p-4 border-b border-gray-100">
                    <div className="text-xs font-bold text-gray-400 mb-2">Plus 프로그램</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{plusOption.name}</span>
                      <span className="text-gray-700">{won(plusOption.price)}</span>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-primary/5">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">패키지 가격</span>
                    <span>{won(level?.price ?? 0)}</span>
                  </div>
                  {procedureTotal > 0 && (
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">추가 시술</span>
                      <span>{won(procedureTotal)}</span>
                    </div>
                  )}
                  {plusTotal > 0 && (
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">Plus 충전</span>
                      <span>{won(plusTotal)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-primary/10 mt-2">
                    <span className="font-bold text-gray-900">예상 합계</span>
                    <span className="text-xl font-extrabold text-primary">{won(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:flex w-full gap-2">
              <button
                type="button"
                onClick={openPatientModal}
                disabled={!level}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                패키지 등록하기
              </button>
              <button
                type="button"
                onClick={() => setConsultModalOpen(true)}
                disabled={!level}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-primary text-primary hover:bg-primary/5 disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-50 font-bold py-3.5 rounded-xl transition-colors text-sm"
              >
                <CalendarClock className="w-5 h-5 flex-shrink-0" />
                방문패키지상담등록하기
              </button>
            </div>
          </div>
        )}

        {/* 데스크탑 내비게이션 */}
        <div className="hidden md:flex items-center justify-between mt-6">
          <button type="button" onClick={goPrev} disabled={step === 1} className="flex items-center gap-1 px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" /> 이전
          </button>
          {step < 3 && (
            <button type="button" onClick={goNext} disabled={step === 1 && !level} className="flex items-center gap-1 px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
              다음 <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
        </>
        )}
      </main>

      {/* 모바일 하단 고정 바 */}
      {!issued && (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">{step === 1 ? '패키지 가격' : '예상 합계'}</span>
          <span className="text-lg font-extrabold text-primary">{won(total)}</span>
        </div>
        <div className="flex items-center gap-2">
          {step > 1 && (
            <button type="button" onClick={goPrev} className="flex items-center justify-center gap-1 px-4 py-3 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl">
              <ChevronLeft className="w-4 h-4" /> 이전
            </button>
          )}
          {step < 3 ? (
            <button type="button" onClick={goNext} disabled={step === 1 && !level} className="flex-1 flex items-center justify-center gap-1 bg-primary text-white font-bold py-3 rounded-xl disabled:bg-gray-300">
              다음 <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex-1 flex gap-2 min-w-0">
              <button
                type="button"
                onClick={openPatientModal}
                disabled={!level}
                className="flex-1 flex items-center justify-center gap-1 bg-primary text-white font-bold py-3 rounded-xl disabled:bg-gray-300 text-xs"
              >
                <UserPlus className="w-4 h-4 flex-shrink-0" />
                패키지 등록
              </button>
              <button
                type="button"
                onClick={() => setConsultModalOpen(true)}
                disabled={!level}
                className="flex-1 flex items-center justify-center gap-1 border-2 border-primary text-primary font-bold py-3 rounded-xl disabled:border-gray-300 disabled:text-gray-400 text-xs"
              >
                <CalendarClock className="w-4 h-4 flex-shrink-0" />
                방문상담 등록
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      <PackageConsultModal
        open={consultModalOpen}
        onClose={() => setConsultModalOpen(false)}
        packageSummary={packageSummary}
        total={total}
      />

      {/* 환자 정보 입력 모달 */}
      {patientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPatientModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">환자 정보 입력</h3>
              <button type="button" onClick={() => setPatientModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">티켓(시술권) 발급을 위해 환자 정보를 입력해주세요.</p>

            <label className="block text-xs font-bold text-gray-600 mb-1">환자 이름</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="예) 김뉴센"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />

            <label className="block text-xs font-bold text-gray-600 mb-1">차트번호</label>
            <input
              type="text"
              value={chartNo}
              onChange={(e) => setChartNo(e.target.value)}
              placeholder="예) 000125"
              onKeyDown={(e) => e.key === 'Enter' && confirmPatient()}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />

            <button
              type="button"
              onClick={confirmPatient}
              disabled={!patientName.trim() || !chartNo.trim()}
              className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              확인 · 티켓 발급
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
