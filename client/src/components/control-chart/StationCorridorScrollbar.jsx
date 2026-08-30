import React, { useRef } from 'react';

/**
 * StationCorridorScrollbar
 * 
 * An interactive vertical corridor scrollbar & navigator for the railway stations axis.
 * Allows section controllers to smoothly pan and scrub across the entire corridor
 * from Origin station (top) to Terminus station (bottom) with a single click or drag.
 */
export default function StationCorridorScrollbar({
  stations = [],
  coordinateModel,
  zoom = 1,
  panY = 0,
  viewportHeight = 600,
  chartHeight = 800,
  onPanChange,
  onJumpStation
}) {
  const trackRef = useRef(null);
  const isDraggingRef = useRef(false);

  const totalContentHeight = chartHeight * zoom;
  const visibleFraction = Math.min(1, Math.max(0.06, viewportHeight / Math.max(totalContentHeight, 1)));
  
  // Calculate max pan
  const maxPanY = Math.max(0, totalContentHeight - viewportHeight);
  const currentPanClamped = Math.min(0, Math.max(-maxPanY, panY));
  const currentRatio = maxPanY > 0 ? -currentPanClamped / maxPanY : 0;

  const handleTrackClick = (e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, clickY / rect.height));
    
    // Center viewport at clicked station ratio
    const targetContentY = ratio * totalContentHeight;
    const targetPanY = -(targetContentY - viewportHeight / 2);
    onPanChange && onPanChange(targetPanY);
  };

  const handleThumbPointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    isDraggingRef.current = true;
    const startClientY = e.clientY;
    const initialPanY = panY;

    const onPointerMove = (moveEvent) => {
      if (!isDraggingRef.current || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const deltaY = moveEvent.clientY - startClientY;
      const deltaRatio = deltaY / rect.height;
      const deltaContentY = deltaRatio * totalContentHeight;
      
      const newPanY = initialPanY - deltaContentY;
      onPanChange && onPanChange(newPanY);
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

  // Filter key stations (Terminals, Junctions, plus evenly spaced)
  const keyStations = stations.filter((s, idx) => {
    const isJct = s.isJunction || s.stationType === 'JUNCTION';
    const isTerm = s.isTerminal || s.stationType === 'TERMINAL' || idx === 0 || idx === stations.length - 1;
    return isJct || isTerm || idx % 5 === 0;
  });

  return (
    <div className="w-9 bg-slate-950/95 border-l border-slate-800 flex flex-col items-center py-1 select-none z-20 font-mono text-[9px] shadow-lg flex-shrink-0">
      {/* Top Jump: Origin Station */}
      <button
        onClick={() => onJumpStation && onJumpStation('ORIGIN')}
        title="Jump to Origin Station (Top)"
        className="w-7 h-5 mb-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 hover:border-cyan-400 flex items-center justify-center font-bold transition-colors"
      >
        ▲
      </button>

      {/* Vertical Interactive Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative flex-1 w-6 bg-slate-900 hover:bg-slate-900/90 rounded border border-slate-800 cursor-pointer overflow-hidden group shadow-inner"
        title="Click or drag to navigate stations along corridor"
      >
        {/* Station Markers along Track */}
        <div className="absolute inset-0 pointer-events-none">
          {keyStations.map((stn, idx) => {
            const stnId = stn._id ? stn._id.toString() : (stn.id || stn.stationCode);
            const y = coordinateModel ? coordinateModel.getStationY(stnId) : idx * 65;
            const pct = (y / Math.max(chartHeight, 1)) * 100;
            const isTerm = stn.isTerminal || idx === 0 || idx === stations.length - 1;
            const isJct = stn.isJunction || stn.stationType === 'JUNCTION';

            return (
              <div
                key={`stn-tick-${stnId}`}
                className="absolute left-0 right-0 flex items-center justify-center"
                style={{ top: `${Math.min(96, Math.max(4, pct))}%`, transform: 'translateY(-50%)' }}
                title={`${stn.stationCode || stn.code || stnId}`}
              >
                {isTerm ? (
                  <div className="w-2.5 h-1 bg-rose-500 rounded-sm" />
                ) : isJct ? (
                  <div className="w-2 h-1 bg-amber-400 rounded-sm" />
                ) : (
                  <div className="w-1.5 h-0.5 bg-slate-600 rounded-sm" />
                )}
              </div>
            );
          })}
        </div>

        {/* Draggable Viewport Window (Thumb) */}
        <div
          onPointerDown={handleThumbPointerDown}
          className="absolute left-0.5 right-0.5 bg-cyan-500/25 hover:bg-cyan-500/35 active:bg-cyan-500/45 border-2 border-cyan-400 rounded cursor-grab active:cursor-grabbing transition-colors flex flex-col items-center justify-center shadow-lg"
          style={{
            top: `${currentRatio * (1 - visibleFraction) * 100}%`,
            height: `${visibleFraction * 100}%`,
            minHeight: '28px'
          }}
          title="Drag to scroll station corridor up and down"
        >
          <div className="flex flex-col space-y-0.5 pointer-events-none">
            <span className="h-0.5 w-2 bg-cyan-300/80 rounded" />
            <span className="h-0.5 w-2 bg-cyan-300/80 rounded" />
            <span className="h-0.5 w-2 bg-cyan-300/80 rounded" />
          </div>
        </div>
      </div>

      {/* Bottom Jump: Terminus Station */}
      <button
        onClick={() => onJumpStation && onJumpStation('TERMINUS')}
        title="Jump to Terminus Station (Bottom)"
        className="w-7 h-5 mt-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 hover:border-cyan-400 flex items-center justify-center font-bold transition-colors"
      >
        ▼
      </button>
    </div>
  );
}
