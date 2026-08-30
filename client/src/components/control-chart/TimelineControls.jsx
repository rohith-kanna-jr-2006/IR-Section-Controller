import React from 'react';

/**
 * TimelineControls
 * 
 * Provides an operational control-room toolbar for live simulation clock,
 * replay scrub bar, play/pause/step controls, speed multipliers, and zoom/pan tools.
 */
export default function TimelineControls({
  simulationTime,
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
  onZoomChange,
  onTimeWindowChange,
  onResetPan
}) {
  const formattedSimTime = new Date(simulationTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const formattedDate = new Date(simulationTime).toLocaleDateString([], {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="bg-slate-900 border-t border-slate-700 px-4 py-2 flex flex-wrap items-center justify-between text-xs font-mono text-slate-200 select-none shadow-lg gap-2">
      {/* Left: Clock Display & Scenario Time */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
          <div className={`w-2.5 h-2.5 rounded-full ${isReplaying ? 'bg-purple-500 animate-pulse' : isLiveRunning ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
          <span className="text-slate-400 text-[10px] uppercase font-semibold">
            {isReplaying ? 'REPLAY' : isLiveRunning ? 'LIVE CLOCK' : 'PAUSED'}
          </span>
          <span className="text-cyan-400 font-bold text-sm tracking-wider font-mono">
            {formattedSimTime}
          </span>
          <span className="text-slate-500 text-[10px]">
            {formattedDate}
          </span>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center space-x-1 bg-slate-800 p-0.5 rounded border border-slate-700">
          {[1, 2, 5, 10].map((spd) => (
            <button
              key={`spd-${spd}`}
              onClick={() => onSpeedChange && onSpeedChange(spd)}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                speedMultiplier === spd
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {`${spd}x`}
            </button>
          ))}
        </div>
      </div>

      {/* Middle: Playback Actions & Replay Scrubber */}
      <div className="flex items-center space-x-3 flex-1 max-w-xl mx-4">
        {/* Step / Play / Pause Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onReset}
            title="Reset Simulation/Replay"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={onPlayPause}
            className={`px-3 py-1.5 rounded font-bold flex items-center space-x-1 transition-colors ${
              (isLiveRunning || isReplaying)
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {(isLiveRunning || isReplaying) ? (
              <>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
                <span>PLAY</span>
              </>
            )}
          </button>

          <button
            onClick={onStep}
            title="Step 1 Tick (+60s)"
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 font-semibold"
          >
            STEP ⏭
          </button>
        </div>

        {/* Replay Scrub Slider */}
        {isReplaying && (
          <div className="flex items-center space-x-2 flex-1">
            <span className="text-[10px] text-purple-400 font-semibold">TAPE:</span>
            <input
              type="range"
              min="0"
              max={Math.max(totalEvents - 1, 1)}
              value={replayIndex}
              onChange={(e) => onReplayScrub && onReplayScrub(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <span className="text-[10px] text-slate-400 font-mono">
              {`${replayIndex}/${totalEvents}`}
            </span>
          </div>
        )}
      </div>

      {/* Right: Zoom & Time Window Controls */}
      <div className="flex items-center space-x-2">
        <span className="text-[10px] text-slate-500 font-semibold">WINDOW:</span>
        <select
          value={timeWindowHours}
          onChange={(e) => onTimeWindowChange && onTimeWindowChange(Number(e.target.value))}
          className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
        >
          <option value={4}>4 Hours</option>
          <option value={8}>8 Hours</option>
          <option value={12}>12 Hours</option>
          <option value={24}>24 Hours (Full Day)</option>
        </select>

        {/* Zoom In / Out / Reset */}
        <div className="flex items-center space-x-1 bg-slate-800 p-0.5 rounded border border-slate-700">
          <button
            onClick={() => onZoomChange && onZoomChange(Math.max(0.25, zoom - 0.2))}
            title="Zoom Out"
            className="px-2 py-1 text-slate-400 hover:text-white"
          >
            -
          </button>
          <span className="px-1 text-[10px] text-cyan-400 font-bold">
            {`${(zoom * 100).toFixed(0)}%`}
          </span>
          <button
            onClick={() => onZoomChange && onZoomChange(Math.min(4, zoom + 0.2))}
            title="Zoom In"
            className="px-2 py-1 text-slate-400 hover:text-white"
          >
            +
          </button>
        </div>

        <button
          onClick={onResetPan}
          title="Reset Pan & View"
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px]"
        >
          FIT
        </button>
      </div>
    </div>
  );
}
