import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Pill,
  FlaskConical,
  Waves,
  Dumbbell,
  MessageCircle,
  ChevronDown,
  X,
} from 'lucide-react';

interface Level {
  key: string;
  badge: string;
  name: string;
  subtitle: string;
  price: number;
  color: string;
  ring: string;
  chip: string;
  button: string;
  icon: typeof Scale;
  features: string[];
}

interface Procedure {
  key: string;
  name: string;
  price: number;
  icon: typeof Droplets;
}

const LEVELS: Level[] = [
  {
    key: 'basic',
    badge: 'LEVEL 1',
    name: 'Basic',
    subtitle: '체중관리',
    price: 49000,
    color: 'text-green-600',
    ring: 'ring-green-500 border-green-500',
    chip: 'bg-green-50 text-green-700',
    button: 'bg-green-600 hover:bg-green-700',
    icon: Scale,
    features: ['체중 측정', '의사 상담', '맞춤 처방', '기본 생활 습관 가이드'],
  },
  {
    key: 'standard',
    badge: 'LEVEL 2',
    name: 'Standard',
    subtitle: '건강관리',
    price: 89000,
    color: 'text-blue-600',
    ring: 'ring-blue-500 border-blue-500',
    chip: 'bg-blue-50 text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700',
    icon: HeartPulse,
    features: [
      '체중 측정 · 의사 상담',
      '맞춤 처방',
      '인바디 분석 (체지방률 · 골격근량 · 내장지방레벨)',
      '생활 습관 가이드',
    ],
  },
  {
    key: 'premium',
    badge: 'LEVEL 3',
    name: 'Premium',
    subtitle: '체형관리',
    price: 129000,
    color: 'text-purple-600',
    ring: 'ring-purple-500 border-purple-500',
    chip: 'bg-purple-50 text-purple-700',
    button: 'bg-purple-600 hover:bg-purple-700',
    icon: Camera,
    features: [
      'Standard 전체 포함',
      '인바디 분석 (체지방률 · 골격근량 · 내장지방레벨)',
      '체형 사진 기록 (정면 · 측면 비교)',
      '변화 그래프 & 리포트',
    ],
  },
];

const PROCEDURES: Procedure[] = [
  { key: 'arginine', name: '아르기닌 수액', price: 50000, icon: Droplets },
  { key: 'carboxy', name: '카복시 테라피', price: 70000, icon: Sparkles },
  { key: 'hpl', name: '뿌부링 HPL', price: 150000, icon: Waves },
  { key: 'lipo', name: '리포뷸', price: 100000, icon: Syringe },
  { key: 'synergy', name: '시너쥰', price: 80000, icon: Dumbbell },
  { key: 'beautyrope', name: '뷰티로프', price: 200000, icon: Activity },
  { key: 'cnu', name: '씨앤유 처방', price: 60000, icon: Pill },
  { key: 'hba1c', name: '당화혈색소 검사', price: 30000, icon: FlaskConical },
];

const FEATURES = [
  { icon: ClipboardCheck, title: '정확한 측정', desc: '인바디 · 허리둘레 · 체형사진' },
  { icon: TrendingUp, title: '변화 기록', desc: '그래프 · 리포트로 확인' },
  { icon: UserRound, title: '맞춤 관리', desc: '의사 상담 · 맞춤 처방' },
  { icon: ShieldCheck, title: '안전한 관리', desc: '검증된 시술 · 체계적 관리' },
];

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function PackageSelectPage() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [procOpen, setProcOpen] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const level = LEVELS.find((l) => l.key === selectedLevel) ?? null;

  const { procedureTotal, total } = useMemo(() => {
    const procTotal = PROCEDURES.filter((p) => selectedProcedures.includes(p.key)).reduce(
      (sum, p) => sum + p.price,
      0,
    );
    return {
      procedureTotal: procTotal,
      total: (level?.price ?? 0) + procTotal,
    };
  }, [level, selectedProcedures]);

  const toggleProcedure = (key: string) => {
    setSelectedProcedures((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28 md:pb-10">
      {/* 상단바 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2.5">
          <Link to="/" className="flex items-center gap-2.5 group" title="홈으로 이동">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors">NewSense BodyCare</div>
              <div className="text-[11px] text-gray-500 leading-tight">체중 · 건강 · 체형 통합관리 프로그램</div>
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4">
        {/* 히어로 */}
        <section className="py-7 text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-snug">
            측정부터 변화까지,
            <br />
            기록으로 관리하는 <span className="text-primary">프리미엄 프로그램</span>
          </h1>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            체중, 인바디, 허리둘레, 체형 사진을 정기적으로 기록하고
            <br className="hidden sm:block" />
            의사와 함께 변화 과정을 관리합니다.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <f.icon className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-gray-800">{f.title}</div>
                <div className="text-[11px] text-gray-400 mt-0.5 leading-tight">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 관리 레벨 선택 */}
        <section className="pt-2">
          <h2 className="text-lg font-bold text-gray-900">관리 레벨 선택</h2>
          <p className="text-xs text-gray-500 mt-1 mb-4">체계적인 3단계 관리 프로그램으로 건강한 변화를 경험하세요.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LEVELS.map((lv) => {
              const active = selectedLevel === lv.key;
              return (
                <button
                  key={lv.key}
                  type="button"
                  onClick={() => setSelectedLevel(lv.key)}
                  className={`text-left bg-white rounded-2xl border p-5 transition-all shadow-sm ${
                    active ? `ring-2 ${lv.ring}` : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${lv.chip}`}>
                      {lv.badge}
                    </span>
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

                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <div className="text-[11px] text-gray-400">월 관리비</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xl font-extrabold ${lv.color}`}>{won(lv.price)}</span>
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg text-white ${
                          active ? 'bg-gray-900' : lv.button
                        }`}
                      >
                        {active ? '선택됨 ✓' : '선택하기 ›'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 추가 시술 선택 */}
        <section className="mt-8">
          <button
            type="button"
            onClick={() => setProcOpen((v) => !v)}
            className="w-full flex items-center justify-between"
          >
            <div className="text-left">
              <h2 className="text-lg font-bold text-gray-900">
                원하는 시술을 선택하세요{' '}
                <span className="text-xs font-normal text-gray-400">(선택 사항)</span>
              </h2>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${procOpen ? 'rotate-180' : ''}`}
            />
          </button>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            원하는 시술만 골라서 체크하세요. 의사 상담 후 개인 상태에 맞게 진행됩니다.
          </p>

          {procOpen && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PROCEDURES.map((p) => {
                const checked = selectedProcedures.includes(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => toggleProcedure(p.key)}
                    className={`relative text-left bg-white rounded-2xl border p-4 transition-all ${
                      checked ? 'border-primary ring-2 ring-primary/30' : 'border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-3 right-3 w-5 h-5 rounded-md flex items-center justify-center border ${
                        checked ? 'bg-primary border-primary text-white' : 'border-gray-300 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${
                        checked ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <p.icon className="w-5 h-5" />
                    </div>
                    <div className="text-sm font-semibold text-gray-800 leading-tight">{p.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{won(p.price)}</div>
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-[11px] text-gray-400 mt-3">
            ※ 시술은 선택 사항이며, 의사 상담 후 개인 상태에 맞게 권장됩니다. 표시 금액은 예시입니다.
          </p>
        </section>

        {/* 요약 (데스크탑/태블릿) */}
        <section className="mt-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-bold text-gray-900 mb-4">선택한 프로그램 요약</h2>
            <div className="space-y-3 text-sm">
              <SummaryRow label="선택한 레벨" value={level ? `${level.name} · ${level.subtitle}` : '미선택'} />
              <SummaryRow label="선택한 시술" value={`${selectedProcedures.length}개`} />
              <SummaryRow label="추가 비용" value={won(procedureTotal)} />
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="font-bold text-gray-900">예상 월 관리비</span>
                <span className="text-xl font-extrabold text-primary">{won(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSubmitted(true)}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              상담 신청하기
            </button>
          </div>
        </section>
      </main>

      {/* 모바일 하단 고정 바 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">예상 월 관리비</span>
          <span className="text-lg font-extrabold text-primary">{won(total)}</span>
        </div>
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl"
        >
          <MessageCircle className="w-5 h-5" />
          상담 신청하기
        </button>
      </div>

      {submitted && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSubmitted(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="ml-auto block text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">상담 신청이 접수되었습니다</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              선택하신 내용을 바탕으로
              <br />
              담당자가 상담을 도와드리겠습니다.
            </p>

            <div className="mt-4 bg-gray-50 rounded-xl p-4 text-left text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">관리 레벨</span>
                <span className="font-medium text-gray-800">
                  {level ? `${level.name} · ${level.subtitle}` : '미선택'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">추가 시술</span>
                <span className="font-medium text-gray-800">{selectedProcedures.length}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">예상 월 관리비</span>
                <span className="font-bold text-primary">{won(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-5 w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-700"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}
