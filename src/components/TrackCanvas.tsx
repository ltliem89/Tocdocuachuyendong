import React, { useRef } from 'react';
import { Flag, Timer, Gauge } from 'lucide-react';
import { formatNumber } from '../simulation/physicsModel';
import { RealisticEntity } from './RealisticEntity';

export interface TrackLane {
  id: string;
  name: string;
  color: string;
  avatarText?: string;
  currentDistance_m: number;
  totalDistance_m: number;
  targetTime_s: number;
  speed_mps: number;
  finished: boolean;
  finishTime_s?: number;
}

interface TrackCanvasProps {
  lanes: TrackLane[];
  maxDistance_m: number;
  elapsedTime_s: number;
  isRunning?: boolean;
  showOneSecondTicks?: boolean;
  unit?: 'm/s' | 'km/h';
  title?: string;
  statusBadge?: React.ReactNode;
  controlsSlot?: React.ReactNode;
}

interface LaneTrackStyle {
  trackBg: string;
  borderColor: string;
  laneNumColor: string;
  centerLineColor: string;
  cardBg: string;
  cardBorder: string;
}

function getLaneTrackStyle(colorHex: string, idx: number): LaneTrackStyle {
  const c = (colorHex || '').toLowerCase();
  
  if (c.includes('3b82f6') || c.includes('blue') || idx % 5 === 0) {
    // Olympic Sapphire Blue Track
    return {
      trackBg: 'bg-gradient-to-r from-blue-950 via-blue-900/65 to-blue-950',
      borderColor: 'border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
      laneNumColor: 'text-blue-400/25',
      centerLineColor: 'border-blue-400/30',
      cardBg: 'bg-slate-900/95',
      cardBorder: 'border-blue-800/40 hover:border-blue-600/50',
    };
  }
  
  if (c.includes('10b981') || c.includes('emerald') || c.includes('green') || idx % 5 === 1) {
    // Olympic Emerald Green Track
    return {
      trackBg: 'bg-gradient-to-r from-emerald-950 via-emerald-900/65 to-emerald-950',
      borderColor: 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
      laneNumColor: 'text-emerald-400/25',
      centerLineColor: 'border-emerald-400/30',
      cardBg: 'bg-slate-900/95',
      cardBorder: 'border-emerald-800/40 hover:border-emerald-600/50',
    };
  }

  if (c.includes('f59e0b') || c.includes('amber') || c.includes('orange') || idx % 5 === 2) {
    // Olympic Tartan Amber Track
    return {
      trackBg: 'bg-gradient-to-r from-amber-950 via-amber-900/65 to-amber-950',
      borderColor: 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
      laneNumColor: 'text-amber-400/25',
      centerLineColor: 'border-amber-400/30',
      cardBg: 'bg-slate-900/95',
      cardBorder: 'border-amber-800/40 hover:border-amber-600/50',
    };
  }

  if (c.includes('8b5cf6') || c.includes('purple') || idx % 5 === 3) {
    // Royal Purple Track
    return {
      trackBg: 'bg-gradient-to-r from-purple-950 via-purple-900/65 to-purple-950',
      borderColor: 'border-purple-500/60 shadow-[0_0_15px_rgba(139,92,246,0.15)]',
      laneNumColor: 'text-purple-400/25',
      centerLineColor: 'border-purple-400/30',
      cardBg: 'bg-slate-900/95',
      cardBorder: 'border-purple-800/40 hover:border-purple-600/50',
    };
  }

  // Ruby / Red Tartan Track
  return {
    trackBg: 'bg-gradient-to-r from-rose-950 via-rose-900/65 to-rose-950',
    borderColor: 'border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
    laneNumColor: 'text-rose-400/25',
    centerLineColor: 'border-rose-400/30',
    cardBg: 'bg-slate-900/95',
    cardBorder: 'border-rose-800/40 hover:border-rose-600/50',
  };
}

export const TrackCanvas: React.FC<TrackCanvasProps> = ({
  lanes,
  maxDistance_m,
  elapsedTime_s,
  isRunning = false,
  showOneSecondTicks = false,
  unit = 'm/s',
  title,
  statusBadge,
  controlsSlot,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate ticks for distance marks (e.g. every 10m or 20m)
  const step = maxDistance_m <= 60 ? 10 : maxDistance_m <= 120 ? 20 : 50;
  const tickMarks: number[] = [];
  for (let m = 0; m <= maxDistance_m; m += step) {
    tickMarks.push(m);
  }
  if (!tickMarks.includes(maxDistance_m)) {
    tickMarks.push(maxDistance_m);
  }

  return (
    <div 
      id="simulation-track-container"
      ref={containerRef}
      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl text-white select-none relative overflow-hidden"
    >
      {/* Top Track HUD: Title, Stopwatch, Ruler Legend & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          {title ? (
            <span className="font-bold text-slate-200 text-xs sm:text-sm tracking-wide">
              {title}
            </span>
          ) : (
            <div className="flex items-center gap-1.5 font-semibold text-sky-400">
              <Gauge className="w-4 h-4" />
              <span>Mô phỏng đường chạy 2D</span>
            </div>
          )}
          {statusBadge}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time Stopwatch HUD */}
          <div className="flex items-center gap-1.5 font-mono bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700/80 shadow-inner">
            <Timer className={`w-3.5 h-3.5 ${isRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-slate-400 text-[11px]">t:</span>
            <span className="text-emerald-300 font-bold text-sm sm:text-base tracking-tight">
              {formatNumber(elapsedTime_s, 2)}s
            </span>
          </div>

          {/* Track Length HUD */}
          <div className="flex items-center gap-1.5 font-mono bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700/80">
            <span className="text-slate-400 text-[11px]">Độ dài s:</span>
            <span className="text-sky-300 font-bold text-xs sm:text-sm">
              {formatNumber(maxDistance_m, 1)}m
            </span>
          </div>
        </div>
      </div>

      {/* Embedded compact controls slot if provided */}
      {controlsSlot && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/60">
          {controlsSlot}
        </div>
      )}

      {/* Track Lanes Area with perfectly aligned start & finish lines */}
      <div className="relative mt-3 pt-3 pb-7">
        {/* Lanes List */}
        <div className="space-y-3 relative z-20">
          {lanes.map((lane, idx) => {
            const progressPct = maxDistance_m > 0 
              ? Math.min(100, Math.max(0, (lane.currentDistance_m / maxDistance_m) * 100))
              : 0;

            const speedDisplay = unit === 'km/h'
              ? `${formatNumber(lane.speed_mps * 3.6, 1)} km/h`
              : `${formatNumber(lane.speed_mps, 2)} m/s`;

            const trackStyle = getLaneTrackStyle(lane.color, idx);

            return (
              <div 
                key={lane.id} 
                className={`${trackStyle.cardBg} border-2 ${trackStyle.cardBorder} rounded-2xl p-2.5 sm:p-3 transition-all relative shadow-md`}
              >
                {/* Lane Info bar */}
                <div className="flex flex-wrap items-center justify-between text-xs mb-2 px-1 gap-2">
                  <div className="flex items-center gap-2">
                    {/* Bright Lane Number Pill */}
                    <span 
                      className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase text-white shadow-md tracking-wider flex items-center gap-1"
                      style={{ backgroundColor: lane.color }}
                    >
                      <span>LÀN {idx + 1}</span>
                    </span>

                    {/* Prominent Glowing Athlete Name Header */}
                    <span 
                      className="font-black text-sm sm:text-base tracking-wide px-2.5 py-0.5 rounded-lg border text-white shadow-sm flex items-center gap-1.5"
                      style={{ 
                        backgroundColor: `${lane.color}25`,
                        borderColor: `${lane.color}70`,
                      }}
                    >
                      <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: lane.color }} />
                      {lane.name}
                    </span>

                    {lane.finished && (
                      <span className="bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 text-[11px] font-extrabold px-2 py-0.5 rounded-lg shadow-sm">
                        ĐÃ VỀ ĐÍCH ({formatNumber(lane.finishTime_s ?? lane.targetTime_s, 2)}s)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs ml-auto">
                    <span className="text-slate-300 bg-slate-950/80 px-2 py-1 rounded-md border border-slate-800">
                      s: <strong className="text-white text-sm">{formatNumber(lane.currentDistance_m, 1)}m</strong> / {lane.totalDistance_m}m
                    </span>
                    <span className="text-slate-300 bg-slate-950/80 px-2 py-1 rounded-md border border-slate-800">
                      v: <strong className="text-amber-300 font-bold">{speedDisplay}</strong>
                    </span>
                  </div>
                </div>

                {/* The running track for this lane - Distinct Color per Lane */}
                <div className={`relative h-24 sm:h-28 ${trackStyle.trackBg} rounded-xl border-2 ${trackStyle.borderColor} flex items-end mx-1 sm:mx-2 px-8 sm:px-12 overflow-visible shadow-inner`}>
                  {/* Big translucent lane number on track floor */}
                  <div className={`absolute left-2 top-1/2 -translate-y-1/2 ${trackStyle.laneNumColor} font-black text-3xl sm:text-4xl font-mono select-none pointer-events-none`}>
                    {idx + 1}
                  </div>

                  {/* Track center dash line */}
                  <div className={`absolute inset-x-0 bottom-4 border-b border-dashed ${trackStyle.centerLineColor} pointer-events-none z-0`} />

                  {/* Start Line (0m) - positioned at z-5 so it sits BEHIND the runner and floating name badge */}
                  <div 
                    className="absolute left-8 sm:left-12 top-0 bottom-0 w-1.5 bg-white/90 shadow-md z-5 pointer-events-none"
                    title="Vạch xuất phát (0m)"
                  >
                    {/* Clean Start Mark at the bottom of the lane, never obscuring runner or name */}
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-300 font-mono tracking-tight whitespace-nowrap bg-slate-900/95 px-1 py-0.2 rounded border border-slate-700 pointer-events-none">
                      0m
                    </div>
                  </div>

                  {/* Finish Line (Checkered Pattern) - z-5 */}
                  <div 
                    className="absolute right-8 sm:right-12 top-0 bottom-0 w-2.5 sm:w-3 bg-[repeating-linear-gradient(45deg,#fff,#fff_3px,#000_3px,#000_6px)] border-y border-white shadow-md z-5 pointer-events-none"
                    title="Vạch đích"
                  >
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-rose-300 font-mono tracking-tight whitespace-nowrap bg-slate-900/95 px-1 py-0.2 rounded border border-slate-700 pointer-events-none">
                      ĐÍCH
                    </div>
                  </div>

                  {/* Visual 1-second distance tick marks on track (Mode 2 feature) */}
                  {showOneSecondTicks && lane.speed_mps > 0 && (
                    <div className="absolute inset-x-8 sm:inset-x-12 inset-y-0 pointer-events-none z-5">
                      {Array.from({ length: Math.floor(lane.targetTime_s) }).map((_, secIdx) => {
                        const sec = secIdx + 1;
                        const distAtSec = sec * lane.speed_mps;
                        if (distAtSec > maxDistance_m) return null;
                        const tickPct = (distAtSec / maxDistance_m) * 100;
                        return (
                          <div 
                            key={sec}
                            className="absolute top-0 bottom-0 border-l border-emerald-400/80 -translate-x-1/2 flex flex-col justify-between py-1"
                            style={{ left: `${tickPct}%` }}
                            title={`Sau ${sec}s: đi được ${formatNumber(distAtSec, 1)}m`}
                          >
                            <span className="text-[9px] font-mono font-bold text-emerald-300 bg-slate-950/95 px-1 rounded border border-emerald-500/40 -translate-x-1/2">
                              {sec}s
                            </span>
                            <span className="text-[8px] font-mono text-emerald-200 bg-slate-950/95 px-0.5 rounded -translate-x-1/2">
                              +{formatNumber(lane.speed_mps, 1)}m
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Realistic Moving Entity (Sprinter / Cyclist / Car / Bus / Walker) */}
                  <div className="absolute inset-x-8 sm:inset-x-12 inset-y-0 pointer-events-none overflow-visible">
                    <div
                      className="absolute bottom-1 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-30 will-change-[left]"
                      style={{ left: `${progressPct}%` }}
                    >
                      {/* Prominent Floating Name Badge on top of Runner - Elevated and NEVER covered by start line */}
                      <div 
                        className="mb-1 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-black text-white shadow-xl border-2 border-white flex items-center gap-1.5 whitespace-nowrap select-none drop-shadow-md transition-transform"
                        style={{ 
                          backgroundColor: lane.color,
                          boxShadow: `0 4px 14px ${lane.color}90`
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span>{lane.name}</span>
                      </div>

                      {/* High-fidelity Realistic Model */}
                      <RealisticEntity
                        avatarText={lane.avatarText}
                        name={lane.name}
                        color={lane.color}
                        speed_mps={lane.speed_mps}
                        elapsedTime_s={elapsedTime_s}
                        isRunning={isRunning && !lane.finished}
                        finished={lane.finished}
                        athleteNumber={lane.avatarText || (idx + 1)}
                      />

                      {/* Speed / Distance indicator badge below entity */}
                      <div className="whitespace-nowrap text-[9px] sm:text-[10px] font-mono font-bold bg-slate-950/95 text-slate-200 px-2 py-0.5 rounded-md border border-slate-700 shadow-md pointer-events-none -mt-1 select-none">
                        {formatNumber(lane.currentDistance_m, 1)}m
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Distance Ruler & Ticks at bottom */}
        <div className="relative mx-1 sm:mx-2 mt-4 h-5 px-8 sm:px-12">
          {tickMarks.map((m) => {
            const pct = (m / maxDistance_m) * 100;
            return (
              <div
                key={m}
                className="absolute top-0 flex flex-col items-center -translate-x-1/2"
                style={{ left: `${pct}%` }}
              >
                <div className="w-px h-2 bg-slate-600" />
                <span className="text-[10px] font-mono text-slate-300 font-bold mt-0.5">
                  {m}m
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
