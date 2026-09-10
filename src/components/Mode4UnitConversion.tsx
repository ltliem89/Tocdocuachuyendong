import React, { useState, useEffect, useRef } from 'react';
import { ArrowRightLeft, CheckCircle2, AlertCircle, Play, RotateCcw, HelpCircle, Car } from 'lucide-react';
import { Language } from '../types';
import { L } from '../i18n/translations';
import { convertUnit, formatNumber } from '../simulation/physicsModel';
import { TrackCanvas, TrackLane } from './TrackCanvas';
import { sounds } from '../simulation/soundEffects';

interface Mode4UnitConversionProps {
  lang: Language;
}

interface QuizItem {
  id: number;
  val: number;
  from: 'm/s' | 'km/h';
  to: 'm/s' | 'km/h';
  answer: number;
}

const QUIZ_LIST: QuizItem[] = [
  { id: 1, val: 10, from: 'm/s', to: 'km/h', answer: 36 },
  { id: 2, val: 54, from: 'km/h', to: 'm/s', answer: 15 },
  { id: 3, val: 20, from: 'm/s', to: 'km/h', answer: 72 },
  { id: 4, val: 90, from: 'km/h', to: 'm/s', answer: 25 },
];

export const Mode4UnitConversion: React.FC<Mode4UnitConversionProps> = ({ lang }) => {
  const t = L[lang];

  // Interactive Live Converter State
  const [inputValue, setInputValue] = useState<number>(10);
  const [fromUnit, setFromUnit] = useState<'m/s' | 'km/h'>('m/s');
  const targetUnit = fromUnit === 'm/s' ? 'km/h' : 'm/s';
  const convertedValue = convertUnit(inputValue, fromUnit, targetUnit);

  // Parallel Race Simulation State (dynamic based on inputValue or presets)
  const currentSpeedMps = fromUnit === 'm/s' ? inputValue : convertedValue;
  const currentSpeedKmh = fromUnit === 'km/h' ? inputValue : convertedValue;
  const raceDist = 100;
  const raceDuration = currentSpeedMps > 0 ? raceDist / currentSpeedMps : 10;

  const [isParallelRunning, setIsParallelRunning] = useState(false);
  const [parallelElapsed, setParallelElapsed] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Parallel track lanes: both have same physical speed, displaying different units
  const parallelLanes: TrackLane[] = [
    {
      id: 'car_mps',
      name: `Xe A (${formatNumber(currentSpeedMps, 1)} m/s)`,
      color: '#3b82f6',
      avatarText: '🚗 A',
      currentDistance_m: Math.min(raceDist, currentSpeedMps * parallelElapsed),
      totalDistance_m: raceDist,
      targetTime_s: raceDuration,
      speed_mps: currentSpeedMps,
      finished: parallelElapsed >= raceDuration,
    },
    {
      id: 'car_kmh',
      name: `Xe B (${formatNumber(currentSpeedKmh, 1)} km/h)`,
      color: '#10b981',
      avatarText: '🚙 B',
      currentDistance_m: Math.min(raceDist, currentSpeedMps * parallelElapsed),
      totalDistance_m: raceDist,
      targetTime_s: raceDuration,
      speed_mps: currentSpeedMps,
      finished: parallelElapsed >= raceDuration,
    },
  ];

  // Parallel animation loop with cancellation safety
  useEffect(() => {
    if (isParallelRunning) {
      let isCancelled = false;
      let lastTime = performance.now();

      const loop = (now: number) => {
        if (isCancelled) return;
        const rawDelta = (now - lastTime) / 1000;
        lastTime = now;
        const deltaSec = Math.max(0, Math.min(0.1, rawDelta));

        setParallelElapsed((prev) => {
          const next = prev + deltaSec;
          if (next >= raceDuration) {
            isCancelled = true;
            setIsParallelRunning(false);
            sounds.playFinish();
            return raceDuration;
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
  }, [isParallelRunning, raceDuration]);

  // Quiz State
  const [quizIdx, setQuizIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

  const currentQuiz = QUIZ_LIST[quizIdx];

  const handleCheckQuiz = () => {
    const num = parseFloat(userAnswer.replace(',', '.'));
    if (isNaN(num)) return;

    const diff = Math.abs(num - currentQuiz.answer);
    if (diff < 0.1) {
      sounds.playSuccess();
      setQuizFeedback({
        isCorrect: true,
        message: lang === 'vi'
          ? `Chính xác! ${currentQuiz.val} ${currentQuiz.from} = ${currentQuiz.answer} ${currentQuiz.to}.`
          : `Correct! ${currentQuiz.val} ${currentQuiz.from} = ${currentQuiz.answer} ${currentQuiz.to}.`,
      });
    } else {
      sounds.playAlert();
      // Misconception check: did they divide instead of multiply or vice versa?
      let hint = '';
      if (currentQuiz.from === 'm/s' && Math.abs(num - (currentQuiz.val / 3.6)) < 0.1) {
        hint = t.mc4Warning; // MC4 feedback!
      } else {
        hint = currentQuiz.from === 'm/s'
          ? (lang === 'vi' ? 'Gợi ý: Từ m/s sang km/h ta lấy giá trị NHÂN với 3,6.' : 'Hint: From m/s to km/h, MULTIPLY by 3.6.')
          : (lang === 'vi' ? 'Gợi ý: Từ km/h sang m/s ta lấy giá trị CHIA cho 3,6.' : 'Hint: From km/h to m/s, DIVIDE by 3.6.');
      }

      setQuizFeedback({
        isCorrect: false,
        message: hint,
      });
    }
  };

  const handleNextQuiz = () => {
    setUserAnswer('');
    setQuizFeedback(null);
    setQuizIdx((prev) => (prev + 1) % QUIZ_LIST.length);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Compact Converter Deck & Simulation Control */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              {t.mode4Title}
            </span>
            <span className="text-slate-500 hidden md:inline">
              1 m/s = 3,6 km/h
            </span>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-slate-400 font-medium hidden sm:inline">Mẫu:</span>
            <button
              onClick={() => {
                setInputValue(10);
                setFromUnit('m/s');
                setParallelElapsed(0);
              }}
              className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-colors"
            >
              10 m/s (36 km/h)
            </button>
            <button
              onClick={() => {
                setInputValue(15);
                setFromUnit('m/s');
                setParallelElapsed(0);
              }}
              className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-colors"
            >
              15 m/s (54 km/h)
            </button>
            <button
              onClick={() => {
                setInputValue(20);
                setFromUnit('m/s');
                setParallelElapsed(0);
              }}
              className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-colors"
            >
              20 m/s (72 km/h)
            </button>
          </div>

          {/* Direct Simulation Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (isParallelRunning) {
                  setIsParallelRunning(false);
                } else {
                  if (parallelElapsed >= raceDuration) setParallelElapsed(0);
                  setIsParallelRunning(true);
                  sounds.playStart();
                }
              }}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all active:scale-95 text-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isParallelRunning ? t.pause : (parallelElapsed >= raceDuration ? t.tryAgain : t.run)}
            </button>
            <button
              onClick={() => {
                setIsParallelRunning(false);
                setParallelElapsed(0);
              }}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition-colors text-xs"
              title={t.reset}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Compact Converter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-700 shrink-0">
            Chuyển đổi:
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step={0.5}
              min={0}
              value={inputValue}
              onChange={(e) => {
                setInputValue(Math.max(0, parseFloat(e.target.value) || 0));
                setParallelElapsed(0);
              }}
              className="w-20 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
            />
            <select
              value={fromUnit}
              onChange={(e) => {
                setFromUnit(e.target.value as 'm/s' | 'km/h');
                setParallelElapsed(0);
              }}
              className="bg-slate-50 border border-slate-300 rounded px-1.5 py-1 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="m/s">m/s</option>
              <option value="km/h">km/h</option>
            </select>
          </div>

          <button
            onClick={() => {
              setFromUnit(fromUnit === 'm/s' ? 'km/h' : 'm/s');
              setParallelElapsed(0);
            }}
            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-transform hover:rotate-180"
            title="Đảo chiều đổi"
          >
            <ArrowRightLeft className="w-3 h-3" />
          </button>

          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1 text-xs font-mono font-bold text-emerald-900">
            <span>= {formatNumber(convertedValue, 2)}</span>
            <span className="text-emerald-700 font-semibold">{targetUnit}</span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono ml-auto hidden md:block">
            {fromUnit === 'm/s'
              ? `${inputValue} m/s × 3,6 = ${formatNumber(convertedValue, 2)} km/h`
              : `${inputValue} km/h ÷ 3,6 = ${formatNumber(convertedValue, 2)} m/s`}
          </div>
        </div>
      </div>

      {/* Dominant Parallel Simulation Track */}
      <TrackCanvas
        title={lang === 'vi' ? 'Mô phỏng song song minh chứng: 2 xe di chuyển ngang hàng nhau' : 'Parallel Simulation Proof'}
        lanes={parallelLanes}
        maxDistance_m={raceDist}
        elapsedTime_s={parallelElapsed}
        isRunning={isParallelRunning}
        showOneSecondTicks={false}
      />

      {/* Secondary Deduction & Quiz Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Step-by-Step Mathematical Deduction & Rules (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-2.5">
          <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Quy tắc đổi đơn vị tốc độ</span>
          </h4>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
              <span className="text-[10px] text-slate-500 font-medium block">Quãng đường</span>
              <span className="font-mono font-bold text-slate-800">1 m = 1/1000 km</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
              <span className="text-[10px] text-slate-500 font-medium block">Thời gian</span>
              <span className="font-mono font-bold text-slate-800">1 s = 1/3600 h</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
              <span className="text-[10px] text-amber-700 font-medium block">Tỉ số v = s/t</span>
              <span className="font-mono font-bold text-amber-900">1 m/s = 3,6 km/h</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <div className="p-2 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <span>Từ m/s ➔ km/h: <strong>× 3,6</strong></span>
            </div>
            <div className="p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              <span>Từ km/h ➔ m/s: <strong>÷ 3,6</strong></span>
            </div>
          </div>
        </div>

        {/* Mini Conversion Quiz (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.unitQuizTitle}</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              Câu {quizIdx + 1}/{QUIZ_LIST.length}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">Đổi giá trị sau:</span>
              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {currentQuiz.val} {currentQuiz.from} = ? {currentQuiz.to}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={userAnswer}
                  placeholder="Nhập số..."
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCheckQuiz();
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <span className="absolute right-2.5 top-1.5 text-[11px] text-slate-400 font-mono">
                  {currentQuiz.to}
                </span>
              </div>

              <button
                onClick={handleCheckQuiz}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0"
              >
                {t.quizSubmit}
              </button>

              {quizFeedback && quizFeedback.isCorrect && (
                <button
                  onClick={handleNextQuiz}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0"
                >
                  Tiếp →
                </button>
              )}
            </div>

            {quizFeedback && (
              <div
                className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 ${
                  quizFeedback.isCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {quizFeedback.isCorrect ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                )}
                <span className="leading-tight">{quizFeedback.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
