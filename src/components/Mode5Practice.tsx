import React, { useState, useEffect, useRef } from 'react';
import { Triangle, CheckCircle2, AlertCircle, Copy, Check, Calculator, Compass, Sparkles, BookOpen, Play, RotateCcw } from 'lucide-react';
import { Language, UnknownTarget } from '../types';
import { L } from '../i18n/translations';
import { calculateSpeed, formatNumber } from '../simulation/physicsModel';
import { sounds } from '../simulation/soundEffects';
import { TrackCanvas, TrackLane } from './TrackCanvas';

interface Mode5PracticeProps {
  lang: Language;
}

interface PracticeExercise {
  id: string;
  target: UnknownTarget;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  givenTextVi: string;
  givenTextEn: string;
  expectedFormula: string;
  expectedAnswer: number;
  expectedUnit: string;
  tolerance: number;
  explanationVi: string;
  explanationEn: string;
}

const EXERCISES: PracticeExercise[] = [
  {
    id: 'p1',
    target: 'v',
    titleVi: 'Bài 1: Tính tốc độ chạy 60m',
    titleEn: 'Problem 1: Calculate 60m dash speed',
    descVi: 'Một bạn học sinh chạy cự li 60 mét hết 10 giây. Hãy xác định tốc độ chạy của bạn đó.',
    descEn: 'A student runs a 60-meter distance in 10 seconds. Determine their running speed.',
    givenTextVi: 's = 60 m; t = 10 s',
    givenTextEn: 's = 60 m; t = 10 s',
    expectedFormula: 'v = s / t',
    expectedAnswer: 6,
    expectedUnit: 'm/s',
    tolerance: 0.05,
    explanationVi: 'Áp dụng công thức v = s / t = 60 / 10 = 6 m/s.',
    explanationEn: 'Apply formula v = s / t = 60 / 10 = 6 m/s.',
  },
  {
    id: 'p2',
    target: 's',
    titleVi: 'Bài 2: Tính quãng đường đi bộ',
    titleEn: 'Problem 2: Calculate walking distance',
    descVi: 'Một bạn đi bộ với tốc độ 4,8 km/h trong thời gian 0,5 giờ (30 phút). Tính quãng đường bạn đã đi.',
    descEn: 'A person walks at a speed of 4.8 km/h for 0.5 hours (30 minutes). Calculate the distance walked.',
    givenTextVi: 'v = 4,8 km/h; t = 0,5 h',
    givenTextEn: 'v = 4.8 km/h; t = 0.5 h',
    expectedFormula: 's = v × t',
    expectedAnswer: 2.4,
    expectedUnit: 'km',
    tolerance: 0.05,
    explanationVi: 'Áp dụng công thức s = v × t = 4,8 × 0,5 = 2,4 km.',
    explanationEn: 'Apply formula s = v × t = 4.8 × 0.5 = 2.4 km.',
  },
  {
    id: 'p3',
    target: 'v',
    titleVi: 'Bài 3: Tốc độ xe đạp',
    titleEn: 'Problem 3: Bicycle speed',
    descVi: 'Một người đi xe đạp đi được quãng đường 4 km trong thời gian 1/3 giờ (20 phút). Tính tốc độ theo đơn vị km/h.',
    descEn: 'A cyclist travels 4 km in 1/3 hour (20 minutes). Calculate their speed in km/h.',
    givenTextVi: 's = 4 km; t = 1/3 h (≈0,333 h)',
    givenTextEn: 's = 4 km; t = 1/3 h (≈0.333 h)',
    expectedFormula: 'v = s / t',
    expectedAnswer: 12,
    expectedUnit: 'km/h',
    tolerance: 0.1,
    explanationVi: 'Áp dụng công thức v = s / t = 4 ÷ (1/3) = 4 × 3 = 12 km/h.',
    explanationEn: 'Apply formula v = s / t = 4 ÷ (1/3) = 4 × 3 = 12 km/h.',
  },
  {
    id: 'p4',
    target: 't',
    titleVi: 'Bài 4: Tính thời gian ô tô',
    titleEn: 'Problem 4: Calculate driving time',
    descVi: 'Một ô tô chạy với tốc độ không đổi 60 km/h trên đường cao tốc dài 150 km. Ô tô đi hết quãng đường trong bao lâu?',
    descEn: 'A car travels at a constant speed of 60 km/h on a 150 km highway. How long does the trip take?',
    givenTextVi: 's = 150 km; v = 60 km/h',
    givenTextEn: 's = 150 km; v = 60 km/h',
    expectedFormula: 't = s / v',
    expectedAnswer: 2.5,
    expectedUnit: 'h',
    tolerance: 0.05,
    explanationVi: 'Áp dụng công thức t = s / v = 150 / 60 = 2,5 giờ (2 giờ 30 phút).',
    explanationEn: 'Apply formula t = s / v = 150 / 60 = 2.5 hours (2h 30m).',
  },
];

export const Mode5Practice: React.FC<Mode5PracticeProps> = ({ lang }) => {
  const t = L[lang];

  // Triangle selection state
  const [selectedTarget, setSelectedTarget] = useState<UnknownTarget>('v');

  // Exercise Solver State
  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);
  const [userSelectedFormula, setUserSelectedFormula] = useState('');
  const [userNumericAnswer, setUserNumericAnswer] = useState('');
  const [exerciseResult, setExerciseResult] = useState<{ isCorrect: boolean; message: string } | null>(null);

  // Real-world lab state
  const [realDist, setRealDist] = useState<number>(100);
  const [realTime, setRealTime] = useState<number>(25);

  // AI Prompt copy status
  const [copiedPromptId, setCopiedPromptId] = useState<number | null>(null);

  const currentExercise = EXERCISES[activeExerciseIdx];

  const handleCheckExercise = () => {
    const num = parseFloat(userNumericAnswer.replace(',', '.'));
    if (isNaN(num)) {
      sounds.playAlert();
      setExerciseResult({
        isCorrect: false,
        message: lang === 'vi' ? 'Vui lòng nhập một số hợp lệ cho kết quả tính.' : 'Please enter a valid number for your result.',
      });
      return;
    }

    const formulaMatch = userSelectedFormula === currentExercise.expectedFormula;
    const valueMatch = Math.abs(num - currentExercise.expectedAnswer) <= currentExercise.tolerance;

    if (!formulaMatch) {
      sounds.playAlert();
      setExerciseResult({
        isCorrect: false,
        message: lang === 'vi'
          ? `Công thức chưa đúng. Để tìm ${currentExercise.target}, công thức đúng là: ${currentExercise.expectedFormula}.`
          : `Formula is not correct. To find ${currentExercise.target}, the correct formula is: ${currentExercise.expectedFormula}.`,
      });
      return;
    }

    if (valueMatch) {
      sounds.playSuccess();
      setExerciseResult({
        isCorrect: true,
        message: lang === 'vi'
          ? `Chính xác hoàn toàn! ${currentExercise.explanationVi}`
          : `Completely correct! ${currentExercise.explanationEn}`,
      });
    } else {
      sounds.playAlert();
      setExerciseResult({
        isCorrect: false,
        message: lang === 'vi'
          ? `Công thức đúng nhưng kết quả số chưa chính xác. Hãy kiểm tra lại phép tính! Gợi ý: ${currentExercise.expectedFormula}`
          : `Formula is right but numeric answer is off. Double check your calculation! Hint: ${currentExercise.expectedFormula}`,
      });
    }
  };

  const handleNextExercise = () => {
    setUserSelectedFormula('');
    setUserNumericAnswer('');
    setExerciseResult(null);
    setActiveExerciseIdx((prev) => (prev + 1) % EXERCISES.length);
  };

  // Simulation State for Real Lab
  const [isSimRunning, setIsSimRunning] = useState(false);
  const [simElapsed, setSimElapsed] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Speed calculation
  const realCalc = calculateSpeed(realDist, realTime);
  const simSpeedMps = realCalc.speed_mps;

  // Animation loop with cancellation safety
  useEffect(() => {
    if (isSimRunning) {
      let isCancelled = false;
      let lastTime = performance.now();

      const loop = (now: number) => {
        if (isCancelled) return;
        const rawDelta = (now - lastTime) / 1000;
        lastTime = now;
        const deltaSec = Math.max(0, Math.min(0.1, rawDelta));

        setSimElapsed((prev) => {
          const next = prev + deltaSec;
          if (next >= realTime) {
            isCancelled = true;
            setIsSimRunning(false);
            sounds.playFinish();
            return realTime;
          }
          return next;
        });

        if (!isCancelled) {
          animFrameRef.current = requestAnimationFrame(loop);
        }
      };

      animFrameRef.current = requestAnimationFrame(loop);

      return () => {
        isCancelled = true;
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }
  }, [isSimRunning, realTime]);

  const simLane: TrackLane[] = [
    {
      id: 'real_runner',
      name: `${realDist}m trong ${realTime}s (${formatNumber(simSpeedMps, 2)} m/s)`,
      color: '#8b5cf6',
      avatarText: realCalc.speed_kmh < 7 ? '🚶' : realCalc.speed_kmh < 25 ? '🏃' : realCalc.speed_kmh < 45 ? '🚲' : '🚌',
      currentDistance_m: Math.min(realDist, simSpeedMps * simElapsed),
      totalDistance_m: realDist,
      targetTime_s: realTime,
      speed_mps: simSpeedMps,
      finished: simElapsed >= realTime,
    },
  ];

  // Benchmarking speed
  const getBenchmarkText = (speed_kmh: number) => {
    if (speed_kmh < 5) {
      return lang === 'vi' ? 'Tương đương tốc độ đi bộ thong thả (~4 - 5 km/h)' : 'Equivalent to casual walking speed (~4 - 5 km/h)';
    } else if (speed_kmh < 15) {
      return lang === 'vi' ? 'Tương đương tốc độ chạy bộ hoặc đạp xe nhẹ (~10 - 15 km/h)' : 'Equivalent to jogging or relaxed cycling (~10 - 15 km/h)';
    } else if (speed_kmh < 30) {
      return lang === 'vi' ? 'Tương đương tốc độ đạp xe thể thao (~20 - 30 km/h)' : 'Equivalent to brisk cycling (~20 - 30 km/h)';
    } else if (speed_kmh < 60) {
      return lang === 'vi' ? 'Tương đương xe buýt / xe máy trong đô thị (~40 - 50 km/h)' : 'Equivalent to city bus / motorbike speed (~40 - 50 km/h)';
    } else {
      return lang === 'vi' ? 'Tương đương tốc độ ô tô trên cao tốc (>60 km/h)' : 'Equivalent to highway vehicle speed (>60 km/h)';
    }
  };

  const handleCopyPrompt = (promptText: string, id: number) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Compact Lab Deck & Simulation Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md border border-purple-200">
              <Compass className="w-3.5 h-3.5" />
              <span>Thực nghiệm chuyển động thực tế</span>
            </span>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-slate-400 font-medium hidden sm:inline">Mẫu:</span>
            <button
              onClick={() => {
                setRealDist(100);
                setRealTime(80);
                setSimElapsed(0);
              }}
              className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border border-slate-200 transition-colors"
            >
              🚶 Đi bộ (100m/80s)
            </button>
            <button
              onClick={() => {
                setRealDist(60);
                setRealTime(10);
                setSimElapsed(0);
              }}
              className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border border-slate-200 transition-colors"
            >
              🏃 Chạy (60m/10s)
            </button>
            <button
              onClick={() => {
                setRealDist(500);
                setRealTime(120);
                setSimElapsed(0);
              }}
              className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border border-slate-200 transition-colors"
            >
              🚲 Đạp xe (500m/120s)
            </button>
            <button
              onClick={() => {
                setRealDist(2000);
                setRealTime(180);
                setSimElapsed(0);
              }}
              className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border border-slate-200 transition-colors hidden md:inline-block"
            >
              🚌 Xe buýt (2000m/180s)
            </button>
          </div>

          {/* Simulation Play / Reset */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (isSimRunning) {
                  setIsSimRunning(false);
                } else {
                  if (simElapsed >= realTime) setSimElapsed(0);
                  setIsSimRunning(true);
                  sounds.playStart();
                }
              }}
              className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all active:scale-95 text-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isSimRunning ? t.pause : (simElapsed >= realTime ? t.tryAgain : t.run)}
            </button>
            <button
              onClick={() => {
                setIsSimRunning(false);
                setSimElapsed(0);
              }}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition-colors text-xs"
              title={t.reset}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Compact parameter inputs & resulting speed bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">s:</span>
            <input
              type="number"
              min={1}
              value={realDist}
              onChange={(e) => {
                setRealDist(Math.max(1, parseFloat(e.target.value) || 1));
                setSimElapsed(0);
              }}
              className="w-20 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-purple-500 outline-none"
            />
            <span className="text-slate-500 font-mono font-semibold">m</span>
          </div>

          <div className="flex items-center gap-1.5 ml-1">
            <span className="font-bold text-slate-700">t:</span>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={realTime}
              onChange={(e) => {
                setRealTime(Math.max(0.5, parseFloat(e.target.value) || 0.5));
                setSimElapsed(0);
              }}
              className="w-18 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-purple-500 outline-none"
            />
            <span className="text-slate-500 font-mono font-semibold">s</span>
          </div>

          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded px-2.5 py-1 text-xs font-mono font-bold text-purple-950 ml-1">
            <span>v = {formatNumber(realCalc.speed_mps, 2)} m/s</span>
            <span className="text-purple-700 font-normal">
              ({formatNumber(realCalc.speed_kmh, 1)} km/h)
            </span>
          </div>

          <div className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[280px] hidden lg:block ml-auto">
            {getBenchmarkText(realCalc.speed_kmh)}
          </div>
        </div>
      </div>

      {/* Dominant Real-Time Motion Simulation */}
      <TrackCanvas
        title="Mô phỏng trực quan chuyển động theo số liệu thực tế"
        lanes={simLane}
        maxDistance_m={realDist}
        elapsedTime_s={simElapsed}
        isRunning={isSimRunning}
        showOneSecondTicks={false}
      />

      {/* Secondary Two-Column: Formula Triangle (6 cols) & Practice Solver (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left: Interactive Formula Triangle & Rules (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Triangle className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.triangleFormulaTitle}</span>
            </h4>
            <span className="text-[10px] text-slate-400">
              Che đại lượng cần tìm
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Visual Pyramid */}
            <div className="sm:col-span-6 flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="relative w-48 h-40 flex flex-col items-center justify-between py-2 select-none">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 256 220">
                  <polygon
                    points="128,10 10,210 246,210"
                    fill="#f8fafc"
                    stroke="#cbd5e1"
                    strokeWidth="3"
                  />
                  <line x1="69" y1="110" x2="187" y2="110" stroke="#94a3b8" strokeWidth="2.5" />
                  <line x1="128" y1="110" x2="128" y2="210" stroke="#94a3b8" strokeWidth="2.5" />
                </svg>

                {/* Target: Distance (s) on Top */}
                <button
                  onClick={() => setSelectedTarget('s')}
                  className={`relative z-10 font-mono font-extrabold text-sm px-3.5 py-1.5 rounded-lg transition-all shadow-xs ${
                    selectedTarget === 's'
                      ? 'bg-amber-500 text-white ring-2 ring-amber-300 scale-105'
                      : 'bg-white text-slate-800 border border-slate-300 hover:bg-amber-50'
                  }`}
                >
                  s (m)
                </button>

                {/* Bottom Row: v and t */}
                <div className="relative z-10 w-full flex justify-around px-1 mb-1">
                  <button
                    onClick={() => setSelectedTarget('v')}
                    className={`font-mono font-extrabold text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs ${
                      selectedTarget === 'v'
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300 scale-105'
                        : 'bg-white text-slate-800 border border-slate-300 hover:bg-blue-50'
                    }`}
                  >
                    v (m/s)
                  </button>

                  <button
                    onClick={() => setSelectedTarget('t')}
                    className={`font-mono font-extrabold text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs ${
                      selectedTarget === 't'
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 scale-105'
                        : 'bg-white text-slate-800 border border-slate-300 hover:bg-emerald-50'
                    }`}
                  >
                    t (s)
                  </button>
                </div>
              </div>
            </div>

            {/* Formula Result Card */}
            <div className="sm:col-span-6 p-3 rounded-xl bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 border border-indigo-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                {selectedTarget === 'v' ? t.targetSpeed : selectedTarget === 's' ? t.targetDistance : t.targetTime}
              </span>

              <div className="text-xl font-extrabold font-mono text-indigo-950">
                {selectedTarget === 'v' && 'v = s / t'}
                {selectedTarget === 's' && 's = v × t'}
                {selectedTarget === 't' && 't = s / v'}
              </div>

              <p className="text-[11px] text-slate-600 leading-snug">
                {selectedTarget === 'v' && 'Tìm tốc độ v: lấy quãng đường s chia cho thời gian t.'}
                {selectedTarget === 's' && 'Tìm quãng đường s: lấy tốc độ v nhân với thời gian t.'}
                {selectedTarget === 't' && 'Tìm thời gian t: lấy quãng đường s chia cho tốc độ v.'}
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-tight flex items-start gap-1.5">
            <span className="font-bold text-amber-700 shrink-0">⚠️</span>
            <span>
              <strong>Đồng nhất đơn vị:</strong> s (m) đi với t (s) cho v (m/s); s (km) đi với t (h) cho v (km/h).
            </span>
          </div>
        </div>

        {/* Right: Guided 5-Step Practice Problems (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.practiceProblemsTitle} ({activeExerciseIdx + 1}/{EXERCISES.length})</span>
            </h4>

            <div className="flex gap-1">
              {EXERCISES.map((ex, idx) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    setActiveExerciseIdx(idx);
                    setUserSelectedFormula('');
                    setUserNumericAnswer('');
                    setExerciseResult(null);
                  }}
                  className={`w-6 h-6 rounded text-xs font-bold font-mono transition-colors ${
                    idx === activeExerciseIdx
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise card */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="font-bold text-slate-900">
              {lang === 'vi' ? currentExercise.titleVi : currentExercise.titleEn}
            </div>
            <p className="text-slate-600 leading-relaxed">
              {lang === 'vi' ? currentExercise.descVi : currentExercise.descEn}
            </p>
            <div className="text-[11px] font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
              {lang === 'vi' ? 'Đã biết: ' : 'Given: '}
              {lang === 'vi' ? currentExercise.givenTextVi : currentExercise.givenTextEn}
            </div>
          </div>

          {/* Formula options */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 block">
              1. Chọn công thức:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {['v = s / t', 's = v × t', 't = s / v'].map((f) => (
                <button
                  key={f}
                  onClick={() => setUserSelectedFormula(f)}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-mono font-bold transition-all text-center ${
                    userSelectedFormula === f
                      ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-300'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Calculate answer */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 block">
              2. Kết quả ({currentExercise.expectedUnit}):
            </span>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={userNumericAnswer}
                  onChange={(e) => setUserNumericAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCheckExercise();
                  }}
                  placeholder="Nhập số..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <span className="absolute right-2.5 top-1.5 text-[11px] text-slate-400 font-mono">
                  {currentExercise.expectedUnit}
                </span>
              </div>

              <button
                onClick={handleCheckExercise}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0"
              >
                Kiểm tra
              </button>

              {exerciseResult && exerciseResult.isCorrect && (
                <button
                  onClick={handleNextExercise}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0"
                >
                  Bài sau →
                </button>
              )}
            </div>
          </div>

          {/* Feedback */}
          {exerciseResult && (
            <div
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 ${
                exerciseResult.isCorrect
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {exerciseResult.isCorrect ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              )}
              <span className="leading-tight">{exerciseResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible/Compact AI Prompt Suggestions */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="font-bold text-slate-800 text-xs">{t.aiPromptsTitle}</span>
          </div>
          <span className="text-[10px] text-slate-400">Gợi ý thảo luận AI</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { id: 1, text: t.prompt1 },
            { id: 2, text: t.prompt2 },
            { id: 3, text: t.prompt3 },
          ].map((item) => (
            <div
              key={item.id}
              className="p-2 bg-slate-50 hover:bg-purple-50/40 border border-slate-200 rounded-lg flex items-center justify-between gap-2 transition-colors text-xs"
            >
              <p className="text-slate-700 line-clamp-2 leading-tight">
                "{item.text}"
              </p>
              <button
                onClick={() => handleCopyPrompt(item.text, item.id)}
                className="shrink-0 p-1 rounded bg-white border border-slate-200 hover:border-purple-300 text-slate-600 hover:text-purple-700 transition-colors"
                title={t.copyPromptBtn}
              >
                {copiedPromptId === item.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
