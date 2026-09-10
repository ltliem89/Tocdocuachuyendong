import React, { useState, useEffect, useRef } from 'react';
import { Layers, Trash2, Copy, Check, BarChart2, TrendingUp, Info, Play, Pause, RotateCcw } from 'lucide-react';
import { Language, ExperimentTrial } from '../types';
import { L } from '../i18n/translations';
import { formatNumber } from '../simulation/physicsModel';
import { sounds } from '../simulation/soundEffects';
import { TrackCanvas, TrackLane } from './TrackCanvas';

interface Mode3CompareProps {
  lang: Language;
  trials: ExperimentTrial[];
  onSetTrials: (trials: ExperimentTrial[]) => void;
  onRemoveTrial: (id: string) => void;
  onClearAll: () => void;
}

export const Mode3Compare: React.FC<Mode3CompareProps> = ({
  lang,
  trials,
  onSetTrials,
  onRemoveTrial,
  onClearAll,
}) => {
  const t = L[lang];
  const [copied, setCopied] = useState(false);
  const [activeCaseNote, setActiveCaseNote] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<'A' | 'B' | 'C' | null>('A');

  // Simulation state for racing all trials together
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Initialize with Case A on mount if empty
  useEffect(() => {
    if (trials.length === 0) {
      handleLoadCaseA();
    }
  }, []);

  const maxRaceTime = trials.length > 0 ? Math.max(...trials.map((tr) => tr.time_s)) : 10;
  const maxDistance = trials.length > 0 ? Math.max(...trials.map((tr) => tr.distance_m)) : 100;

  // Animation loop with cancellation safety
  useEffect(() => {
    if (isRunning) {
      let isCancelled = false;
      let lastTime = performance.now();

      const loop = (now: number) => {
        if (isCancelled) return;
        const rawDelta = (now - lastTime) / 1000;
        lastTime = now;
        const deltaSec = Math.max(0, Math.min(0.1, rawDelta));

        setElapsedTime((prev) => {
          const next = prev + deltaSec;
          if (next >= maxRaceTime) {
            isCancelled = true;
            setIsRunning(false);
            sounds.playFinish();
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
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }
  }, [isRunning, maxRaceTime]);

  const handleToggleRun = () => {
    if (elapsedTime >= maxRaceTime) {
      setElapsedTime(0);
      setIsRunning(true);
      sounds.playStart();
    } else {
      const next = !isRunning;
      setIsRunning(next);
      if (next) sounds.playStart();
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime(0);
  };

  // Convert trials to TrackLane[]
  const lanes: TrackLane[] = trials.map((tr, idx) => {
    const progress = Math.min(tr.distance_m, tr.speed_mps * elapsedTime);
    const finished = elapsedTime >= tr.time_s;
    return {
      id: tr.id,
      name: tr.name,
      color: tr.color,
      avatarText: `${idx + 1}`,
      currentDistance_m: progress,
      totalDistance_m: tr.distance_m,
      targetTime_s: tr.time_s,
      speed_mps: tr.speed_mps,
      finished,
      finishTime_s: finished ? tr.time_s : undefined,
    };
  });

  // Load Preset Case A: Cùng s = 100m, t khác nhau
  const handleLoadCaseA = () => {
    handleReset();
    setActivePreset('A');
    const caseA: ExperimentTrial[] = [
      {
        id: 'case_a_1',
        name: lang === 'vi' ? 'Vật A1 (s=100m, t=10s)' : 'Object A1 (s=100m, t=10s)',
        distance_m: 100,
        time_s: 10,
        speed_mps: 10.0,
        speed_kmh: 36.0,
        color: '#10b981',
        timestamp: Date.now(),
        note: lang === 'vi' ? 't nhỏ hơn (10s) -> Nhanh hơn' : 'Shorter time (10s) -> Faster',
      },
      {
        id: 'case_a_2',
        name: lang === 'vi' ? 'Vật A2 (s=100m, t=20s)' : 'Object A2 (s=100m, t=20s)',
        distance_m: 100,
        time_s: 20,
        speed_mps: 5.0,
        speed_kmh: 18.0,
        color: '#f59e0b',
        timestamp: Date.now() + 1,
        note: lang === 'vi' ? 't lớn hơn (20s) -> Chậm hơn' : 'Longer time (20s) -> Slower',
      },
    ];
    onSetTrials(caseA);
    setActiveCaseNote(t.caseAExplanation);
    sounds.playSuccess();
  };

  // Load Preset Case B: Cùng t = 10s, s khác nhau
  const handleLoadCaseB = () => {
    handleReset();
    setActivePreset('B');
    const caseB: ExperimentTrial[] = [
      {
        id: 'case_b_1',
        name: lang === 'vi' ? 'Vật B1 (s=60m, t=10s)' : 'Object B1 (s=60m, t=10s)',
        distance_m: 60,
        time_s: 10,
        speed_mps: 6.0,
        speed_kmh: 21.6,
        color: '#3b82f6',
        timestamp: Date.now(),
        note: lang === 'vi' ? 's nhỏ hơn (60m) -> Chậm hơn' : 'Smaller distance -> Slower',
      },
      {
        id: 'case_b_2',
        name: lang === 'vi' ? 'Vật B2 (s=120m, t=10s)' : 'Object B2 (s=120m, t=10s)',
        distance_m: 120,
        time_s: 10,
        speed_mps: 12.0,
        speed_kmh: 43.2,
        color: '#8b5cf6',
        timestamp: Date.now() + 1,
        note: lang === 'vi' ? 's lớn hơn (120m) -> Nhanh hơn gấp đôi' : 'Greater distance -> Twice as fast',
      },
    ];
    onSetTrials(caseB);
    setActiveCaseNote(t.caseBExplanation);
    sounds.playSuccess();
  };

  // Load Preset Case C: Cả s và t đều khác nhau (MC1: B đi xa hơn nhưng lại chậm hơn!)
  const handleLoadCaseC = () => {
    handleReset();
    setActivePreset('C');
    const caseC: ExperimentTrial[] = [
      {
        id: 'case_c_1',
        name: lang === 'vi' ? 'Vật C1 (s=100m, t=10s)' : 'Object C1 (s=100m, t=10s)',
        distance_m: 100,
        time_s: 10,
        speed_mps: 10.0,
        speed_kmh: 36.0,
        color: '#06b6d4',
        timestamp: Date.now(),
        note: lang === 'vi' ? '10 m/s (Nhanh hơn)' : '10 m/s (Faster)',
      },
      {
        id: 'case_c_2',
        name: lang === 'vi' ? 'Vật C2 (s=120m, t=20s)' : 'Object C2 (s=120m, t=20s)',
        distance_m: 120,
        time_s: 20,
        speed_mps: 6.0,
        speed_kmh: 21.6,
        color: '#f43f5e',
        timestamp: Date.now() + 1,
        note: lang === 'vi' ? '6 m/s (Đi 120m xa hơn nhưng CHẬM hơn!)' : '6 m/s (Traveled 120m further but SLOWER!)',
      },
    ];
    onSetTrials(caseC);
    setActiveCaseNote(t.caseCExplanation);
    sounds.playSuccess();
  };

  // Copy table to clipboard
  const handleCopyTable = () => {
    if (trials.length === 0) return;
    const header = `${t.trialName}\t${t.distance} (m)\t${t.time} (s)\t${t.speed} (m/s)\t${t.speed} (km/h)`;
    const rows = trials.map(
      (tr) => `${tr.name}\t${tr.distance_m}\t${tr.time_s}\t${formatNumber(tr.speed_mps, 2)}\t${formatNumber(tr.speed_kmh, 1)}`
    );
    const text = [header, ...rows].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Bounds for graphs
  const maxS = Math.max(120, ...trials.map((tr) => tr.distance_m));
  const maxT = Math.max(20, ...trials.map((tr) => tr.time_s));
  const maxV = Math.max(12, ...trials.map((tr) => tr.speed_mps));

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Compact Preset Selector & Simulation Trigger Dock */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-200">
              <Layers className="w-3.5 h-3.5" />
              {t.mode3Title}
            </span>
            <span className="text-slate-500 hidden md:inline">
              {t.mode3Subtitle}
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            <span className="text-slate-400 font-medium hidden sm:inline">Kịch bản:</span>
            <button
              onClick={handleLoadCaseA}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                activePreset === 'A'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              A: Cùng s=100m
            </button>
            <button
              onClick={handleLoadCaseB}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                activePreset === 'B'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              B: Cùng t=10s
            </button>
            <button
              onClick={handleLoadCaseC}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                activePreset === 'C'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ⚠️ C: Khác cả s & t
            </button>
          </div>

          {/* Direct Simulation Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleRun}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all active:scale-95 text-xs"
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  {t.pause}
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {elapsedTime >= maxRaceTime ? t.tryAgain : (lang === 'vi' ? 'Chạy đua đối chiếu' : 'Run Race')}
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition-colors text-xs"
              title="Đặt lại đường chạy"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Compact Case Note Banner */}
        {activeCaseNote && (
          <div className="p-2 bg-indigo-50/70 border border-indigo-200/80 rounded-lg flex items-center gap-2 text-xs text-indigo-950">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-medium leading-normal">{activeCaseNote}</span>
          </div>
        )}
      </div>

      {/* Physics Track Canvas - THE DOMINANT VISUAL HERO */}
      <TrackCanvas
        title={lang === 'vi' ? `Đua đối chiếu các trường hợp (Đường chạy: ${maxDistance}m)` : `Comparative Race Simulation`}
        lanes={lanes}
        maxDistance_m={maxDistance}
        elapsedTime_s={elapsedTime}
        isRunning={isRunning}
        showOneSecondTicks={false}
      />

      {/* Comparison Table & Scientific Graph Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Comparison Table (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <span>Bảng số liệu đối chiếu</span>
            </h3>

            <div className="flex items-center gap-1.5">
              {trials.length > 0 && (
                <>
                  <button
                    onClick={handleCopyTable}
                    className="flex items-center gap-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border border-slate-300 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                  <button
                    onClick={onClearAll}
                    className="flex items-center gap-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1 rounded border border-rose-200 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xoá</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {trials.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
              {t.tableEmpty}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2 px-2.5">Thử nghiệm</th>
                    <th className="py-2 px-2">s (m)</th>
                    <th className="py-2 px-2">t (s)</th>
                    <th className="py-2 px-2 bg-blue-50 text-blue-900 font-bold">v (m/s)</th>
                    <th className="py-2 px-2 font-mono">v (km/h)</th>
                    <th className="py-2 px-2 text-right">Xoá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {trials.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-2.5 font-sans font-semibold text-slate-800 flex items-center gap-1.5">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: tr.color }}
                        />
                        <span className="truncate max-w-[150px]">{tr.name}</span>
                      </td>
                      <td className="py-2 px-2">{tr.distance_m}m</td>
                      <td className="py-2 px-2 font-bold text-slate-800">{tr.time_s}s</td>
                      <td className="py-2 px-2 bg-blue-50/70 font-bold text-blue-700">
                        {formatNumber(tr.speed_mps, 2)}
                      </td>
                      <td className="py-2 px-2 text-slate-600">
                        {formatNumber(tr.speed_kmh, 1)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <button
                          onClick={() => onRemoveTrial(tr.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Compact s-t graph & speed bars (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Đồ thị s - t (Độ dốc = Tốc độ)</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              dốc lớn = nhanh hơn
            </span>
          </div>

          {/* SVG Graph View */}
          <div className="w-full h-36 bg-slate-950 rounded-lg p-2 relative overflow-hidden flex flex-col justify-end text-white border border-slate-800">
            <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="30" y1="15" x2="30" y2="130" stroke="#334155" strokeWidth="1" />
              <line x1="30" y1="130" x2="385" y2="130" stroke="#334155" strokeWidth="1" />

              {/* Subgrid */}
              <line x1="30" y1="72" x2="385" y2="72" stroke="#1e293b" strokeDasharray="2 2" />
              <line x1="207" y1="15" x2="207" y2="130" stroke="#1e293b" strokeDasharray="2 2" />

              {/* Axis Labels */}
              <text x="365" y="125" fill="#94a3b8" fontSize="10" fontFamily="monospace">t (s)</text>
              <text x="35" y="25" fill="#94a3b8" fontSize="10" fontFamily="monospace">s (m)</text>

              {/* Plot each trial as line from (0,0) to (t, s) */}
              {trials.map((tr) => {
                const x = 30 + (tr.time_s / maxT) * 340;
                const y = 130 - (tr.distance_m / maxS) * 110;

                return (
                  <g key={tr.id}>
                    {/* Speed line */}
                    <line
                      x1="30"
                      y1="130"
                      x2={x}
                      y2={y}
                      stroke={tr.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* End point dot */}
                    <circle cx={x} cy={y} r="4" fill={tr.color} stroke="#fff" strokeWidth="1" />
                    {/* Label on point */}
                    <text
                      x={x + 4}
                      y={y - 3}
                      fill="#fff"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {formatNumber(tr.speed_mps, 1)} m/s
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Mini Speed Bar Chart */}
          <div className="space-y-1.5 pt-1">
            {trials.map((tr) => {
              const widthPct = Math.min(100, Math.max(5, (tr.speed_mps / maxV) * 100));
              return (
                <div key={tr.id} className="space-y-0.5">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                    <span className="truncate max-w-[140px]">{tr.name}</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {formatNumber(tr.speed_mps, 2)} m/s
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${widthPct}%`, backgroundColor: tr.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
