import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Play, Pause, RotateCcw, Award, CheckCircle2, AlertCircle, HelpCircle, Trophy, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { L } from '../i18n/translations';
import { TrackCanvas, TrackLane } from './TrackCanvas';
import { calculateSpeed, formatNumber } from '../simulation/physicsModel';
import { sounds } from '../simulation/soundEffects';

interface Mode1WarmupProps {
  lang: Language;
}

const INITIAL_ATHLETES = [
  { id: 'a', nameKey: 'athleteA', nameVi: 'Nguyễn Anh', nameEn: 'Nguyen Anh', distance_m: 60, time_s: 10.0, color: '#3b82f6', avatar: 'A' },
  { id: 'b', nameKey: 'athleteB', nameVi: 'Trần Bình', nameEn: 'Tran Binh', distance_m: 60, time_s: 9.5, color: '#10b981', avatar: 'B' },
  { id: 'c', nameKey: 'athleteC', nameVi: 'Lê Cao', nameEn: 'Le Cao', distance_m: 60, time_s: 11.0, color: '#f59e0b', avatar: 'C' },
];

export const Mode1Warmup: React.FC<Mode1WarmupProps> = ({ lang }) => {
  const t = L[lang];

  // Prediction state: order of athlete IDs [1st, 2nd, 3rd]
  const [predictedRank, setPredictedRank] = useState<{ first: string; second: string; third: string }>({
    first: '',
    second: '',
    third: '',
  });

  // Simulation running state
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 1x or 2x playback

  const animFrameRef = useRef<number | null>(null);

  // Lanes data calculated from physics
  const lanes: TrackLane[] = INITIAL_ATHLETES.map((ath) => {
    const calc = calculateSpeed(ath.distance_m, ath.time_s);
    const progressDist = Math.min(ath.distance_m, calc.speed_mps * elapsedTime);
    const finished = elapsedTime >= ath.time_s;

    return {
      id: ath.id,
      name: lang === 'vi' ? ath.nameVi : ath.nameEn,
      color: ath.color,
      avatarText: ath.avatar,
      currentDistance_m: progressDist,
      totalDistance_m: ath.distance_m,
      targetTime_s: ath.time_s,
      speed_mps: calc.speed_mps,
      finished,
      finishTime_s: finished ? ath.time_s : undefined,
    };
  });

  const maxRaceTime = Math.max(...INITIAL_ATHLETES.map((a) => a.time_s)); // 11.0s

  // Robust Animation Loop
  useEffect(() => {
    if (isRunning) {
      let isCancelled = false;
      let lastTime = performance.now();

      const loop = (now: number) => {
        if (isCancelled) return;
        const rawDelta = (now - lastTime) / 1000;
        lastTime = now;
        const deltaSec = Math.max(0, Math.min(0.1, rawDelta)) * speedMultiplier;

        setElapsedTime((prev) => {
          const next = prev + deltaSec;
          if (next >= maxRaceTime) {
            isCancelled = true;
            setIsRunning(false);
            setIsFinished(true);
            sounds.playFinish();
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
            return maxRaceTime;
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
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
      };
    }
  }, [isRunning, maxRaceTime, speedMultiplier]);

  const handleToggleRace = () => {
    if (isFinished || elapsedTime >= maxRaceTime) {
      // Re-run from beginning
      setElapsedTime(0);
      setIsFinished(false);
      setIsRunning(true);
      sounds.playStart();
    } else {
      const nextRunning = !isRunning;
      setIsRunning(nextRunning);
      if (nextRunning) {
        sounds.playStart();
      }
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setElapsedTime(0);
  };

  const handleAutoPredict = () => {
    setPredictedRank({ first: 'b', second: 'a', third: 'c' });
    sounds.playSuccess();
  };

  // Check prediction
  const hasPredicted = Boolean(predictedRank.first && predictedRank.second && predictedRank.third);
  const isPredictionCorrect =
    predictedRank.first === 'b' &&
    predictedRank.second === 'a' &&
    predictedRank.third === 'c';

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Compact Context Bar: Title, 3 Athlete Mini-Pills, Speed Toggle */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-md border border-amber-200">
              <Trophy className="w-3.5 h-3.5" />
              {t.mode1Title}
            </span>
            <span className="text-xs text-slate-500 hidden md:inline">
              {t.mode1Instruction}
            </span>
          </div>

          {/* 3 Athlete Data Badges (Ultra-compact) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
            {INITIAL_ATHLETES.map((ath) => (
              <div 
                key={ath.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50"
              >
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: ath.color }} 
                />
                <span className="font-semibold text-slate-800">
                  {lang === 'vi' ? ath.nameVi : ath.nameEn}:
                </span>
                <span className="font-mono text-slate-600 font-medium">
                  {ath.distance_m}m / <strong className="text-slate-900">{ath.time_s}s</strong>
                </span>
              </div>
            ))}

            <button
              onClick={() => setSpeedMultiplier(speedMultiplier === 1 ? 2 : 1)}
              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg border border-slate-300 transition-colors"
              title="Tốc độ diễn hoạt"
            >
              {speedMultiplier}x
            </button>
          </div>
        </div>

        {/* Compact Prediction & Action Dock */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-amber-900 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              {lang === 'vi' ? 'Dự đoán thứ hạng:' : 'Predict rank:'}
            </span>

            {/* Rank 1 */}
            <div className="flex items-center gap-1 bg-amber-50/80 border border-amber-300 rounded-lg px-2 py-1 shadow-2xs">
              <span className="font-bold text-amber-800">🥇</span>
              <select
                value={predictedRank.first}
                onChange={(e) => setPredictedRank({ ...predictedRank, first: e.target.value })}
                disabled={isRunning || isFinished}
                className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="">-- Về nhất --</option>
                {INITIAL_ATHLETES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {lang === 'vi' ? a.nameVi : a.nameEn} ({a.time_s}s)
                  </option>
                ))}
              </select>
            </div>

            {/* Rank 2 */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 shadow-2xs">
              <span className="font-bold text-slate-600">🥈</span>
              <select
                value={predictedRank.second}
                onChange={(e) => setPredictedRank({ ...predictedRank, second: e.target.value })}
                disabled={isRunning || isFinished}
                className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="">-- Về nhì --</option>
                {INITIAL_ATHLETES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {lang === 'vi' ? a.nameVi : a.nameEn} ({a.time_s}s)
                  </option>
                ))}
              </select>
            </div>

            {/* Rank 3 */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 shadow-2xs">
              <span className="font-bold text-slate-600">🥉</span>
              <select
                value={predictedRank.third}
                onChange={(e) => setPredictedRank({ ...predictedRank, third: e.target.value })}
                disabled={isRunning || isFinished}
                className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="">-- Về ba --</option>
                {INITIAL_ATHLETES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {lang === 'vi' ? a.nameVi : a.nameEn} ({a.time_s}s)
                  </option>
                ))}
              </select>
            </div>
            {/* Quick Auto-predict helper */}
            <button
              onClick={handleAutoPredict}
              disabled={isRunning || isFinished}
              className="hidden sm:inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-800 bg-amber-100/60 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-md transition-colors"
              title="Điền nhanh dự đoán mẫu"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              {lang === 'vi' ? 'Dự đoán mẫu' : 'Sample guess'}
            </button>
          </div>

          {/* Action buttons right here in the compact dock */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleRace}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-lg shadow-sm transition-all active:scale-95 text-xs cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  {t.pause}
                </>
              ) : isFinished ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  {lang === 'vi' ? 'Chạy lại' : t.tryAgain}
                </>
              ) : elapsedTime > 0 ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {lang === 'vi' ? 'Tiếp tục' : 'Resume'}
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {t.startRace}
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors text-xs cursor-pointer"
              title={t.reset}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t.reset}
            </button>

            {isFinished && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {t.raceFinished}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Physics Track Canvas - THE DOMINANT VISUAL HERO */}
      <TrackCanvas
        title={lang === 'vi' ? 'Đường chạy thi đấu 60 mét' : '60-meter Sprint Race'}
        lanes={lanes}
        maxDistance_m={60}
        elapsedTime_s={elapsedTime}
        isRunning={isRunning}
        showOneSecondTicks={false}
      />

      {/* Post-Race Revelation & Scientific Reasoning (Unfolds cleanly below track) */}
      {isFinished && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Prediction feedback box or General Result Summary */}
          {hasPredicted ? (
            <div 
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                isPredictionCorrect 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              {isPredictionCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold text-base">
                  {isPredictionCorrect ? t.correct : t.notQuite}
                </div>
                <p className="text-sm mt-0.5 leading-relaxed">
                  {isPredictionCorrect
                    ? (lang === 'vi' 
                        ? 'Xuất sắc! Em đã dự đoán chính xác: Trần Bình (9,5s) về nhất, Nguyễn Anh (10s) về nhì, Lê Cao (11s) về ba!' 
                        : 'Excellent! You predicted correctly: Tran Binh (9.5s) 1st, Nguyen Anh (10s) 2nd, Le Cao (11s) 3rd!')
                    : (lang === 'vi'
                        ? 'Lưu ý: Với cùng một quãng đường 60m, bạn nào mất THỜI GIAN ÍT HƠN (nhỏ hơn) thì chạy NHANH HƠN. Thứ tự đúng là: Trần Bình (9,5s) > Nguyễn Anh (10s) > Lê Cao (11s).'
                        : 'Note: For the same 60m distance, the runner taking LESS time is FASTER. The true order is: Tran Binh (9.5s) > Nguyen Anh (10s) > Le Cao (11s).')
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-950 flex items-start gap-3">
              <Trophy className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-base">
                  {lang === 'vi' ? 'Kết quả cuộc thi đấu 60 mét' : '60m Race Results'}
                </div>
                <p className="text-sm mt-0.5 leading-relaxed">
                  {lang === 'vi'
                    ? 'Trần Bình (9,5s) về nhất, Nguyễn Anh (10s) về nhì, Lê Cao (11s) về ba! Với cùng một quãng đường 60m, bạn nào mất thời gian ít hơn thì chuyển động nhanh hơn.'
                    : 'Tran Binh (9.5s) finished 1st, Nguyen Anh (10s) 2nd, and Le Cao (11s) 3rd! For the same 60m distance, the runner taking less time is faster.'}
                </p>
              </div>
            </div>
          )}

          {/* Quantitative Data Table showing s/t ratio */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-x-auto">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-base">
                {t.mode1FormulaNotice}
              </h3>
            </div>

            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                  <th className="py-2.5 px-3">{t.tableHeaderAthlete}</th>
                  <th className="py-2.5 px-3">{t.tableHeaderDistance}</th>
                  <th className="py-2.5 px-3">{t.tableHeaderTime}</th>
                  <th className="py-2.5 px-3 bg-amber-50 text-amber-900 font-bold">{t.tableHeaderSpeed}</th>
                  <th className="py-2.5 px-3 text-center">{t.tableHeaderRank}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {/* Tran Binh - Rank 1 */}
                <tr className="bg-emerald-50/40 hover:bg-emerald-50 transition-colors">
                  <td className="py-3 px-3 font-sans font-bold text-emerald-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    {lang === 'vi' ? 'Trần Bình' : 'Tran Binh'}
                  </td>
                  <td className="py-3 px-3">60 m</td>
                  <td className="py-3 px-3 font-bold text-slate-800">9,5 s</td>
                  <td className="py-3 px-3 bg-emerald-100/60 font-bold text-emerald-700">
                    60 / 9,5 ≈ <strong>6,32 m/s</strong>
                  </td>
                  <td className="py-3 px-3 text-center font-sans">
                    <span className="inline-flex items-center gap-1 bg-emerald-600 text-white font-bold text-xs px-2 py-0.5 rounded-full shadow-xs">
                      🥇 {t.rank1}
                    </span>
                  </td>
                </tr>

                {/* Nguyen Anh - Rank 2 */}
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-sans font-semibold text-blue-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    {lang === 'vi' ? 'Nguyễn Anh' : 'Nguyen Anh'}
                  </td>
                  <td className="py-3 px-3">60 m</td>
                  <td className="py-3 px-3 font-bold text-slate-800">10,0 s</td>
                  <td className="py-3 px-3 bg-slate-50 font-bold text-blue-700">
                    60 / 10 = <strong>6,00 m/s</strong>
                  </td>
                  <td className="py-3 px-3 text-center font-sans">
                    <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-800 font-semibold text-xs px-2 py-0.5 rounded-full">
                      🥈 {t.rank2}
                    </span>
                  </td>
                </tr>

                {/* Le Cao - Rank 3 */}
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-sans font-semibold text-amber-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    {lang === 'vi' ? 'Lê Cao' : 'Le Cao'}
                  </td>
                  <td className="py-3 px-3">60 m</td>
                  <td className="py-3 px-3 font-bold text-slate-800">11,0 s</td>
                  <td className="py-3 px-3 bg-slate-50 font-bold text-amber-700">
                    60 / 11 ≈ <strong>5,45 m/s</strong>
                  </td>
                  <td className="py-3 px-3 text-center font-sans">
                    <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-800 font-semibold text-xs px-2 py-0.5 rounded-full">
                      🥉 {t.rank3}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Scientific Explanation card */}
            <div className="mt-4 p-4 bg-slate-50 border-l-4 border-emerald-500 rounded-r-xl">
              <h4 className="font-bold text-slate-800 text-sm">
                💡 {t.mode1ExplainHeader}
              </h4>
              <p className="text-slate-700 text-sm mt-1 leading-relaxed">
                {t.mode1ExplainContent}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
