import React, { useState } from 'react';

/**
 * ChartLegend
 * 
 * Compact collapsible operational chart legend explaining stringline styles,
 * conflict symbols, block occupancies, and distance modes.
 */
export default function ChartLegend() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute bottom-12 right-4 z-30 bg-slate-900/90 border border-slate-700 rounded shadow-xl text-xs font-mono text-slate-300 backdrop-blur-sm transition-all max-w-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-slate-800 text-[11px] font-bold text-cyan-400"
      >
        <span>OPERATIONAL LEGEND</span>
        <span>{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="p-3 border-t border-slate-800 space-y-3 text-[10px]">
          {/* Train Line Styles */}
          <div>
            <div className="text-slate-400 font-bold mb-1 uppercase text-[9px]">Train Stringlines</div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-4 h-0.5 bg-cyan-400 inline-block" />
                <span>On-Time Train</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-0.5 bg-amber-400 inline-block" />
                <span>Delayed (&gt;5m)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-0.5 bg-red-500 inline-block" />
                <span>Heavy Delay (&gt;30m)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-0.5 border-b border-emerald-400 border-dashed inline-block" />
                <span>What-If Trajectory</span>
              </div>
            </div>
          </div>

          {/* Conflict Symbols */}
          <div>
            <div className="text-slate-400 font-bold mb-1 uppercase text-[9px]">Conflict Markers</div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-red-500 font-bold">◆</span>
                <span>Crossing Conflict</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-amber-500 font-bold">▲</span>
                <span>Overtaking Conflict</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400 font-bold">⚠</span>
                <span>Following/Headway</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">◇</span>
                <span>AI Recommendation</span>
              </div>
            </div>
          </div>

          {/* Block Occupancy */}
          <div>
            <div className="text-slate-400 font-bold mb-1 uppercase text-[9px]">Block Section Status</div>
            <div className="grid grid-cols-3 gap-1">
              <div className="bg-red-950/60 text-red-300 border border-red-800 text-center py-0.5 rounded">
                OCCUPIED
              </div>
              <div className="bg-cyan-950/60 text-cyan-300 border border-cyan-800 text-center py-0.5 rounded">
                RESERVED
              </div>
              <div className="bg-amber-950/60 text-amber-300 border border-amber-800 text-center py-0.5 rounded">
                BLOCKED
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
