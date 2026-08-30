import React from 'react';

/**
 * MasterChartNavHUD
 * 
 * Floating high-precision operational navigation heads-up display.
 * Provides Section Controllers with:
 * - 4-direction Step Pan D-pad (◀ ▲ ▼ ▶)
 * - Quick End-to-End Jump Buttons: 00:00, LIVE, 24:00, ORIGIN, TERMINUS
 * - Fit All, Zoom +, Zoom -, 100%
 * - Viewport Coordinates readout
 */
export default function MasterChartNavHUD({
  pan = { x: 0, y: 0 },
  zoom = 1,
  chartWidth = 2880,
  chartHeight = 1600,
  viewportWidth = 800,
  viewportHeight = 600,
  activeTimeWindow = 24,
  stationsCount = 0,
  onStepPan,
  onJumpTime,
  onJumpStation,
  onFitAll,
  onZoomIn,
  onZoomOut,
  onZoom100
}) {
  const zoomPct = Math.round(zoom * 100);

  return (
    <div className="absolute bottom-4 right-14 z-30 flex items-center space-x-2 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-2 shadow-2xl font-mono text-xs select-none text-slate-200">
      {/* 1. D-Pad Directional Step Pan */}
      <div className="flex flex-col items-center justify-center p-1 bg-slate-900/90 rounded border border-slate-800">
        <button
          onClick={() => onStepPan && onStepPan(0, 1)}
          title="Pan Up (Shift+Up)"
          className="w-6 h-5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-cyan-300 hover:text-white rounded flex items-center justify-center font-bold text-[11px] transition-colors"
        >
          ▲
        </button>
        <div className="flex items-center space-x-1 my-0.5">
          <button
            onClick={() => onStepPan && onStepPan(1, 0)}
            title="Pan Left (Shift+Left)"
            className="w-6 h-5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-cyan-300 hover:text-white rounded flex items-center justify-center font-bold text-[11px] transition-colors"
          >
            ◀
          </button>
          <button
            onClick={onFitAll}
            title="Fit Corridor & Time Window (Home/0)"
            className="w-6 h-5 bg-cyan-950 hover:bg-cyan-900 active:bg-cyan-700 border border-cyan-800 text-cyan-300 rounded flex items-center justify-center font-extrabold text-[9px] transition-colors"
          >
            FIT
          </button>
          <button
            onClick={() => onStepPan && onStepPan(-1, 0)}
            title="Pan Right (Shift+Right)"
            className="w-6 h-5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-cyan-300 hover:text-white rounded flex items-center justify-center font-bold text-[11px] transition-colors"
          >
            ▶
          </button>
        </div>
        <button
          onClick={() => onStepPan && onStepPan(0, -1)}
          title="Pan Down (Shift+Down)"
          className="w-6 h-5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-cyan-300 hover:text-white rounded flex items-center justify-center font-bold text-[11px] transition-colors"
        >
          ▼
        </button>
      </div>

      {/* 2. End-to-End Jump Shortcuts */}
      <div className="flex flex-col space-y-1 pl-1 border-l border-slate-800">
        <div className="flex items-center space-x-1">
          <span className="text-[9px] text-slate-500 font-bold uppercase w-8">TIME:</span>
          <button
            onClick={() => onJumpTime && onJumpTime('START')}
            title="Jump to 00:00"
            className="px-1.5 py-0.5 bg-slate-850 hover:bg-slate-750 text-cyan-300 hover:text-white border border-slate-700 rounded text-[9px] font-bold"
          >
            00:00
          </button>
          <button
            onClick={() => onJumpTime && onJumpTime('LIVE')}
            title="Jump to Live Clock Needle"
            className="px-1.5 py-0.5 bg-red-950 hover:bg-red-900 text-red-300 hover:text-white border border-red-800 rounded text-[9px] font-bold"
          >
            LIVE
          </button>
          <button
            onClick={() => onJumpTime && onJumpTime('END')}
            title="Jump to 24:00"
            className="px-1.5 py-0.5 bg-slate-850 hover:bg-slate-750 text-cyan-300 hover:text-white border border-slate-700 rounded text-[9px] font-bold"
          >
            24:00
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <span className="text-[9px] text-slate-500 font-bold uppercase w-8">STN:</span>
          <button
            onClick={() => onJumpStation && onJumpStation('ORIGIN')}
            title="Jump to Top Origin Station"
            className="px-1.5 py-0.5 bg-slate-850 hover:bg-slate-750 text-cyan-300 hover:text-white border border-slate-700 rounded text-[9px] font-bold"
          >
            ORIGIN ⬆
          </button>
          <button
            onClick={() => onJumpStation && onJumpStation('TERMINUS')}
            title="Jump to Bottom Terminus Station"
            className="px-1.5 py-0.5 bg-slate-850 hover:bg-slate-750 text-cyan-300 hover:text-white border border-slate-700 rounded text-[9px] font-bold"
          >
            TERMINUS ⬇
          </button>
        </div>
      </div>

      {/* 3. Zoom Controls */}
      <div className="flex flex-col items-center space-y-1 pl-1 border-l border-slate-800">
        <div className="flex items-center space-x-1">
          <button
            onClick={onZoomOut}
            title="Zoom Out (-)"
            className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 font-bold flex items-center justify-center text-xs"
          >
            -
          </button>
          <button
            onClick={onZoom100}
            title="Reset Zoom to 100%"
            className="px-1.5 h-5 bg-slate-900 text-cyan-400 font-bold text-[10px] rounded border border-slate-800 hover:bg-slate-800 flex items-center justify-center"
          >
            {zoomPct}%
          </button>
          <button
            onClick={onZoomIn}
            title="Zoom In (+)"
            className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 font-bold flex items-center justify-center text-xs"
          >
            +
          </button>
        </div>
        <span className="text-[8px] text-slate-500 tracking-wider">
          {stationsCount} STATIONS
        </span>
      </div>
    </div>
  );
}
