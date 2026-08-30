import React from 'react';

/**
 * TimelineControls
 * 
 * Provides an authentic Indian Railways control-room bottom toolbar:
 * - Playback: Reset, Play/Pause, Step (+60s), Speed Multipliers (1x, 2x, 5x, 10x)
 * - 24-Hour Time Scrubber: 00:00 to 24:00 slider with live timestamp badge
 * - Time Window Presets: 24H (Full Day), 12H, 6H, 3H, CUSTOM
 * - Quick Zoom Multipliers: 0.5x, 1x, 2x, 4x, FIT
 * - Accessible Tabular View trigger
 */
export default function TimelineControls({
  simulationTime,
  timeWindowStart,
  isReplaying = false,
  isLiveRunning = false,
  replayIndex = 0,
  totalEvents = 100,
  speedMultiplier = 1,
  timeWindowHours = 24,
  zoom = 1,
  onPlayPause,
  onStep,
  onReset,
  onSpeedChange,
  onReplayScrub,
  onTimeScrub,
  onZoomChange,
  onTimeWindowChange,
  onResetPan,
  onOpenTableView
}) {
  const currentSimDate = new Date(simulationTime);
  const formattedSimTime = currentSimDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const formattedDate = currentSimDate.toLocaleDateString([], {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });

  // Calculate current scrubber minutes from base day
  const baseStartMs = new Date(timeWindowStart || simulationTime).getTime();
  const currentMs = currentSimDate.getTime();
  const elapsedMinutes = Math.max(0, Math.min(1440, Math.floor((currentMs - baseStartMs) / 60000)));

  return (
    <div className="bg-slate-950 border-t border-slate-700/90 px-3 py-2 flex flex-wrap items-center justify-between text-xs font-mono text-slate-200 select-none shadow-2xl gap-2 z-30">
      {/* 1. Left: Playback & Speed */}
      <div className="flex items-center space-x-2">
        {/* Reset / Rewind */}
        <button
          onClick={onReset}
          title="Reset Simulation Clock to Start"
          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 transition-colors"
        >
          <span className="font-bold text-xs">⏮</span>
        </button>

        {/* Play / Pause */}
        <button
          onClick={onPlayPause}
          className={`px-3 py-1.5 rounded font-bold flex items-center space-x-1.5 transition-all shadow-md ${
            (isLiveRunning || isReplaying)
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
          }`}
        >
          {(isLiveRunning || isReplaying) ? (
            <>
              <span>⏸</span>
              <span className="text-[11px] tracking-wider">PAUSE</span>
            </>
          ) : (
            <>
              <span>▶</span>
              <span className="text-[11px] tracking-wider">PLAY</span>
            </>
          )}
        </button>

        {/* Single Step (+60s) */}
        <button
          onClick={onStep}
          title="Advance 1 Minute (+60s)"
          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-700 font-bold text-[11px] transition-colors"
        >
          STEP ⏭
        </button>

        {/* Speed Multiplier Segment */}
        <div className="flex items-center space-x-0.5 bg-slate-900 p-0.5 rounded border border-slate-800">
          {[1, 2, 5, 10].map((spd) => (
            <button
              key={`spd-${spd}`}
              onClick={() => onSpeedChange && onSpeedChange(spd)}
              className={`px-1.5 py-1 rounded text-[10px] font-bold transition-colors ${
                speedMultiplier === spd
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {`${spd}×`}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Middle: Continuous Time Scrubber & Digital Clock */}
      <div className="flex items-center space-x-2 flex-1 max-w-2xl mx-2 bg-slate-900/80 px-3 py-1 rounded border border-slate-800">
        <span className="text-[10px] font-bold text-slate-500">00:00</span>
        
        {/* Scrubber Range Input */}
        <input
          type="range"
          min="0"
          max="1440"
          step="1"
          value={elapsedMinutes}
          onChange={(e) => {
            if (onTimeScrub) {
              const mins = Number(e.target.value);
              const targetTime = new Date(baseStartMs + mins * 60000);
              onTimeScrub(targetTime);
            }
          }}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
          title="Drag to scrub simulation time"
        />

        <span className="text-[10px] font-bold text-slate-500">24:00</span>

        {/* Simulation Clock Display */}
        <div className="flex items-center space-x-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-nowrap flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${isReplaying ? 'bg-purple-400 animate-pulse' : isLiveRunning ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'}`} />
          <span className="text-cyan-300 font-bold text-xs font-mono">
            {formattedSimTime}
          </span>
          <span className="text-slate-500 text-[9px]">
            {formattedDate}
          </span>
        </div>
      </div>

      {/* 3. Right: Time Windows, Zoom & Accessible View */}
      <div className="flex items-center space-x-2">
        {/* Time Window Presets */}
        <div className="flex items-center space-x-0.5 bg-slate-900 p-0.5 rounded border border-slate-800">
          {[
            { hours: 24, label: '24H' },
            { hours: 12, label: '12H' },
            { hours: 6, label: '6H' },
            { hours: 3, label: '3H' }
          ].map((w) => (
            <button
              key={`win-${w.hours}`}
              onClick={() => onTimeWindowChange && onTimeWindowChange(w.hours)}
              className={`px-1.5 py-1 rounded text-[10px] font-bold transition-colors ${
                timeWindowHours === w.hours
                  ? 'bg-slate-700 text-cyan-300 border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Zoom Multipliers */}
        <div className="flex items-center space-x-0.5 bg-slate-900 p-0.5 rounded border border-slate-800">
          {[
            { scale: 0.5, label: '0.5×' },
            { scale: 1.0, label: '1×' },
            { scale: 2.0, label: '2×' },
            { scale: 4.0, label: '4×' }
          ].map((z) => (
            <button
              key={`zoom-${z.scale}`}
              onClick={() => onZoomChange && onZoomChange(z.scale)}
              className={`px-1.5 py-1 rounded text-[10px] font-bold transition-colors ${
                Math.abs(zoom - z.scale) < 0.1
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>

        {/* FIT View */}
        <button
          onClick={onResetPan}
          title="Fit Master Chart to Screen"
          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 text-[11px] font-bold transition-colors"
        >
          FIT
        </button>

        {/* Accessible Table View Toggle */}
        {onOpenTableView && (
          <button
            onClick={onOpenTableView}
            title="Open High-Contrast Accessible Tabular View"
            className="px-2 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800 text-[10px] font-bold transition-colors flex items-center space-x-1"
          >
            <span>📊</span>
            <span>TABLE</span>
          </button>
        )}
      </div>
    </div>
  );
}

