import React, { useRef, useEffect } from 'react';

/**
 * TimeNavigatorScrollbar
 * 
 * An interactive horizontal 24h operational timeline navigator & scrollbar.
 * Allows section controllers to smoothly pan and scrub across the entire
 * operational day (00:00 - 24:00) with a single click or drag.
 */
export default function TimeNavigatorScrollbar({
  activeTimeWindow = 24,
  pixelsPerHour = 120,
  zoom = 1,
  panX = 0,
  viewportWidth = 800,
  liveClockX = 0,
  baseTimeStart = Date.now(),
  onPanChange,
  onJumpTime
}) {
  const trackRef = useRef(null);
  const isDraggingRef = useRef(false);

  const totalContentWidth = activeTimeWindow * pixelsPerHour * zoom;
  const visibleFraction = Math.min(1, Math.max(0.04, viewportWidth / Math.max(totalContentWidth, 1)));
  
  // Calculate max pan
  const maxPanX = Math.max(0, totalContentWidth - viewportWidth);
  const currentPanClamped = Math.min(0, Math.max(-maxPanX, panX));
  const currentRatio = maxPanX > 0 ? -currentPanClamped / maxPanX : 0;

  // Live simulation time position (fraction 0..1)
  const liveFraction = totalContentWidth > 0 ? (liveClockX * zoom) / totalContentWidth : 0;

  const handleTrackClick = (e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    
    // Center viewport at clicked time ratio
    const targetContentX = ratio * totalContentWidth;
    const targetPanX = -(targetContentX - viewportWidth / 2);
    onPanChange && onPanChange(targetPanX);
  };

  const handleThumbPointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    isDraggingRef.current = true;
    const startClientX = e.clientX;
    const initialPanX = panX;

    const onPointerMove = (moveEvent) => {
      if (!isDraggingRef.current || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const deltaX = moveEvent.clientX - startClientX;
      const deltaRatio = deltaX / rect.width;
      const deltaContentX = deltaRatio * totalContentWidth;
      
      const newPanX = initialPanX - deltaContentX;
      onPanChange && onPanChange(newPanX);
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Generate 4-hour tick marks (00:00, 04:00, 08:00, 12:00, 16:00, 20:00, 24:00)
  const step = activeTimeWindow <= 12 ? 2 : 4;
  const tickHours = [];
  for (let h = 0; h <= activeTimeWindow; h += step) {
    tickHours.push(h);
  }

  return (
    <div className="w-full bg-slate-950/95 border-t border-slate-800 px-3 py-1.5 flex items-center space-x-3 select-none z-20 font-mono text-[10px]">
      <div className="flex items-center space-x-1 text-slate-400 font-bold flex-shrink-0">
        <span className="text-cyan-400">⏱ TIME TRACK:</span>
        <span>{activeTimeWindow}H</span>
      </div>

      {/* Interactive Navigation Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative flex-1 h-6 bg-slate-900 hover:bg-slate-900/90 rounded border border-slate-800 cursor-pointer overflow-hidden group shadow-inner"
        title="Click or drag to navigate 24-hour timetable"
      >
        {/* Hour Ticks & Labels */}
        <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none text-slate-500 font-semibold text-[9px]">
          {tickHours.map((h) => {
            const pct = (h / activeTimeWindow) * 100;
            const hourLabel = `${String(h % 24).padStart(2, '0')}:00`;
            return (
              <div
                key={`tick-${h}`}
                className="absolute top-0 bottom-0 flex flex-col justify-between items-center"
                style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
              >
                <span className="h-1.5 w-[1px] bg-slate-700" />
                <span className="text-[8.5px] text-slate-500">{hourLabel}</span>
              </div>
            );
          })}
        </div>

        {/* Live Simulation Clock Needle Indicator */}
        {liveFraction >= 0 && liveFraction <= 1 && (
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 pointer-events-none shadow-[0_0_8px_#ef4444]"
            style={{ left: `${liveFraction * 100}%` }}
            title="Current Simulation Clock Position"
          >
            <div className="w-2 h-2 -ml-[3px] -mt-[1px] bg-red-500 rounded-full" />
          </div>
        )}

        {/* Draggable Viewport Window (Thumb) */}
        <div
          onPointerDown={handleThumbPointerDown}
          className="absolute top-0.5 bottom-0.5 bg-cyan-500/25 hover:bg-cyan-500/35 active:bg-cyan-500/45 border-2 border-cyan-400 rounded cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center shadow-lg"
          style={{
            left: `${currentRatio * (1 - visibleFraction) * 100}%`,
            width: `${visibleFraction * 100}%`,
            minWidth: '32px'
          }}
          title="Drag to scroll time window across the day"
        >
          <div className="flex space-x-0.5 pointer-events-none">
            <span className="w-0.5 h-2.5 bg-cyan-300/80 rounded" />
            <span className="w-0.5 h-2.5 bg-cyan-300/80 rounded" />
            <span className="w-0.5 h-2.5 bg-cyan-300/80 rounded" />
          </div>
        </div>
      </div>

      {/* Quick Jump Buttons */}
      <div className="flex items-center space-x-1 flex-shrink-0">
        <button
          onClick={() => onJumpTime && onJumpTime('START')}
          title="Jump to 00:00 (Start of Day)"
          className="px-2 py-0.5 bg-slate-850 hover:bg-slate-750 text-cyan-300 border border-slate-700 hover:border-cyan-500 rounded text-[9.5px] font-bold transition-colors"
        >
          ⏮ 00:00
        </button>
        <button
          onClick={() => onJumpTime && onJumpTime('LIVE')}
          title="Center on Live Simulation Clock Needle"
          className="px-2 py-0.5 bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800 hover:border-red-500 rounded text-[9.5px] font-bold transition-colors"
        >
          📍 LIVE
        </button>
        <button
          onClick={() => onJumpTime && onJumpTime('END')}
          title="Jump to 24:00 (End of Day)"
          className="px-2 py-0.5 bg-slate-850 hover:bg-slate-750 text-cyan-300 border border-slate-700 hover:border-cyan-500 rounded text-[9.5px] font-bold transition-colors"
        >
          24:00 ⏭
        </button>
      </div>
    </div>
  );
}
