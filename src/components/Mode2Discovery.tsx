import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Lightbulb, BookmarkPlus, Check, Sparkles, Sliders } from 'lucide-react';
import { Language, ExperimentTrial } from '../types';
import { L } from '../i18n/translations';
import { TrackCanvas, TrackLane } from './TrackCanvas';
import { calculateSpeed, formatNumber } from '../simulation/physicsModel';
import { sounds } from '../simulation/soundEffects';

interface Mode2DiscoveryProps {
  lang: Language;
  onSaveTrial: (trial: ExperimentTrial) => void;
}

export const Mode2Discovery: React.FC<Mode2DiscoveryProps> = ({ lang, onSaveTrial }) => {
  const t = L[lang];

  // Configurable inputs for distance and time
  const [distance, setDistance] = useState<number>(60);
  const [time, setTime] = useState<number>(10);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Simulation controls
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [explorationCount, setExplorationCount] = useState<number>(0);
  const [showReflection, setShowReflection] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Scientific calculation
  const calc = calculateSpeed(distance, time);

  // Lanes representation
  const progressDist = Math.min(distance, calc.speed_mps * elapsedTime);
  const finished = elapsedTime >= time;

  const lanes: TrackLane[] = [
    {
      id: 'discovery-runner',
      name: lang === 'vi' ? 'Vật chuyển động' : 'Moving Object',
      color: '#3b82f6',
      avatarText: '🏃',
      currentDistance_m: progressDist,
      totalDistance_m: distance,
      targetTime_s: time,
      speed_mps: calc.speed_mps,
      finished,
      finishTime_s: finished ? time : undefined,
    },
  ];

  // Animation Loop with cancellation safety
  useEffect(() => {
    if (isRunning) {
      let isCancelled = false;
      let lastTime = performance.now();

      const loop = (now: number) => {
        if (isCancelled) return;
        const rawDelta = (now - lastTime) / 1000;
        lastTime = now;
        const deltaSec = Math.max(0, Math.min(0.1, rawDelta)) * playbackSpeed;

        setElapsedTime((prev) => {
          const next = prev + deltaSec;
          if (next >= time) {
            isCancelled = true;
            setIsRunning(false);
            sounds.playFinish();
            setExplorationCount((c) => c + 1);
            return time;
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
  }, [isRunning, time, playbackSpeed]);

  const handleRunToggle = () => {
    if (elapsedTime >= time) {
      setElapsedTime(0);
      setIsRunning(true);
      sounds.playStart();
    } else {
      const nextRunning = !isRunning;
      setIsRunning(nextRunning);
      if (nextRunning) sounds.playStart();
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime(0);
  };

  const handleSaveToCompare = () => {
    const newTrial: ExperimentTrial = {
      id: 'trial_' + Date.now(),
      name: `${lang === 'vi' ? 'Thử nghiệm' : 'Trial'} (s=${distance}m, t=${time}s)`,
      distance_m: distance,
      time_s: time,
      speed_mps: calc.speed_mps,
      speed_kmh: calc.speed_kmh,
      color: '#3b82f6',
      timestamp: Date.now(),
    };
    onSaveTrial(newTrial);
    sounds.playSuccess();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Compact Control Deck: Title, Presets, Sliders & Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-2.5">
        {/* Row 1: Title, Quick Presets & Playback Speed */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-md border border-sky-200">
              <Sparkles className="w-3.5 h-3.5" />
              {t.mode2Title}
            </span>
            <span className="text-slate-500 hidden md:inline">
              {t.mode2Subtitle}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Quick Sample Presets */}
            <span className="text-slate-400 font-medium hidden sm:inline">Mẫu:</span>
            <button
              onClick={() => { setDistance(60); setTime(10); handleReset(); }}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                distance === 60 && time === 10
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              60m / 10s
            </button>
            <button
              onClick={() => { setDistance(100); setTime(20); handleReset(); }}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                distance === 100 && time === 20
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              100m / 20s
            </button>
            <button
              onClick={() => { setDistance(120); setTime(10); handleReset(); }}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                distance === 120 && time === 10
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              120m / 10s
            </button>

            {/* Playback speed */}
            <button
              onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 0.5 : 1)}
              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-300 transition-colors"
              title="Tốc độ diễn hoạt"
            >
              {playbackSpeed}x
            </button>
          </div>
        </div>

        {/* Row 2: Ultra-Compact Sliders, Live Speed HUD & Action Buttons */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center pt-2 border-t border-slate-100">
          {/* Sliders: Distance and Time (6 cols) */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Distance Slider */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  Quãng đường (s):
                </span>
                <div className="flex items-center gap-1 font-mono font-bold text-blue-700">
                  <input
                    type="number"
                    min={10}
                    max={300}
                    value={distance}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(500, Number(e.target.value) || 1));
                      setDistance(val);
                      handleReset();
                    }}
                    className="w-14 px-1 py-0.2 text-right font-mono font-bold bg-white border border-slate-300 rounded text-slate-900 text-xs"
                  />
                  <span>m</span>
                </div>
              </div>
              <input
                type="range"
                min={10}
                max={300}
                step={5}
                value={distance}
                onChange={(e) => {
                  setDistance(Number(e.target.value));
                  handleReset();
                }}
                className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Time Slider */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  Thời gian (t):
                </span>
                <div className="flex items-center gap-1 font-mono font-bold text-emerald-700">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={time}
                    onChange={(e) => {
                      const val = Math.max(0.5, Math.min(100, Number(e.target.value) || 1));
                      setTime(val);
                      handleReset();
                    }}
                    className="w-14 px-1 py-0.2 text-right font-mono font-bold bg-white border border-slate-300 rounded text-slate-900 text-xs"
                  />
                  <span>s</span>
                </div>
              </div>
              <input
                type="range"
                min={2}
                max={30}
                step={0.5}
                value={time}
                onChange={(e) => {
                  setTime(Number(e.target.value));
                  handleReset();
                }}
                className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
          </div>

          {/* Real-time Computed Speed Metrics (3 cols) */}
          <div className="lg:col-span-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-2 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-blue-700 block">
                Tốc độ v = s / t:
              </span>
              <div className="text-base sm:text-lg font-bold text-blue-950 font-mono">
                {formatNumber(calc.speed_mps, 2)} <span className="text-xs font-semibold text-blue-600">m/s</span>
              </div>
            </div>
            <div className="text-right font-mono text-[11px] text-slate-600">
              <div className="font-bold text-slate-800">
                {formatNumber(calc.speed_kmh, 1)} km/h
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold">
                1s đi: {formatNumber(calc.distanceInOneSec, 1)}m
              </div>
            </div>
          </div>

          {/* Action Buttons (3 cols) */}
          <div className="lg:col-span-3 flex items-center gap-1.5 justify-end">
            <button
              onClick={handleRunToggle}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-lg shadow-sm transition-all active:scale-95 text-xs flex-1 sm:flex-initial justify-center"
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  {t.pause}
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {finished ? t.tryAgain : t.run}
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold px-2 py-2 rounded-lg shadow-2xs transition-colors text-xs"
              title={t.reset}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleSaveToCompare}
              className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-2.5 py-2 rounded-lg shadow-2xs transition-colors text-xs"
              title="Lưu thử nghiệm sang Chế độ 3 để so sánh"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã lưu!</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Lưu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Physics Track Canvas - THE DOMINANT VISUAL HERO with 1-Second Ticks */}
      <TrackCanvas
        title={lang === 'vi' ? 'Đường chạy với vạch chia khoảng cách trong 1 giây (+ v = s/t)' : 'Track with 1-second distance intervals'}
        lanes={lanes}
        maxDistance_m={distance}
        elapsedTime_s={elapsedTime}
        isRunning={isRunning}
        showOneSecondTicks={true}
      />

      {/* Discovery & Pedagogical Insight Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-800 text-base">
              {t.discoveryQuestion1}
            </h3>
          </div>
          <button
            onClick={() => setShowReflection(!showReflection)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
          >
            {showReflection ? (lang === 'vi' ? 'Thu gọn' : 'Collapse') : (lang === 'vi' ? 'Xem gợi ý suy luận' : 'View Reasoning Hint')}
          </button>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed font-medium">
          👉 {t.discoveryQ1Text}
        </p>

        {showReflection && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-950 space-y-2 animate-in fade-in duration-200">
            <p>
              💡 <strong>{t.discoveryQ1Answer}</strong>
            </p>
            <p className="text-xs text-blue-800">
              {lang === 'vi'
                ? `Với thiết lập hiện tại: trong 1 giây vật chạy được đúng ${formatNumber(calc.distanceInOneSec, 2)} mét. Nếu tăng quãng đường hoặc giảm thời gian, con số này sẽ lớn lên!`
                : `With current settings: in 1 second, the object covers exactly ${formatNumber(calc.distanceInOneSec, 2)} meters. If distance increases or time decreases, this number increases!`}
            </p>
          </div>
        )}

        {/* Scientific Conclusion Box (Always prominent or unlocked) */}
        <div className="mt-4 p-5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl text-white shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-100">
            <Sparkles className="w-4 h-4 text-amber-200" />
            {t.discoveryUnlockedTitle}
          </div>
          <p className="text-base sm:text-lg font-bold mt-2 leading-relaxed">
            {t.discoveryConclusionText}
          </p>
          <div className="mt-3 inline-block bg-white/20 backdrop-blur-xs px-3 py-1 rounded-lg font-mono text-sm font-bold border border-white/30">
            v = s / t
          </div>
        </div>
      </div>
    </div>
  );
};
