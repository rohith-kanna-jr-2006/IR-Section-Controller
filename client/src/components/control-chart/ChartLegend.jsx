import React, { useState } from 'react';

/**
 * ChartLegend
 * 
 * Compact collapsible operational chart legend explaining train class stringlines,
 * conflict markers, block occupancies, and halts.
 */
export default function ChartLegend() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute bottom-12 right-4 z-30 bg-slate-950/95 border border-slate-700 rounded-lg shadow-2xl text-xs font-mono text-slate-300 backdrop-blur-md transition-all max-w-md">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-slate-850 text-[11px] font-bold text-cyan-400"
      >
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>IR MASTER GRAPH LEGEND</span>
        </span>
        <span className="text-slate-400">{isExpanded ? '▲ HIDE' : '▼ SHOW'}</span>
      </button>

      {isExpanded && (
        <div className="p-3 border-t border-slate-800 space-y-3 text-[10px]">
          {/* Train Service Classes */}
          <div>
            <div className="text-slate-400 font-bold mb-1.5 uppercase text-[9px] tracking-wider">Train Service Classes</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-1 bg-[#818CF8] rounded inline-block" />
                <span className="text-slate-200">Vande Bharat Exp</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-1 bg-[#F59E0B] rounded inline-block" />
                <span className="text-slate-200">Shatabdi / Rajdhani</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-1 bg-[#38BDF8] rounded inline-block" />
                <span className="text-slate-200">Superfast Express</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-1 bg-[#60A5FA] rounded inline-block" />
                <span className="text-slate-200">Mail / Express</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-1 bg-[#10B981] rounded inline-block" />
                <span className="text-slate-200">Passenger / EMU</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-1 bg-[#FB923C] rounded inline-block" />
                <span className="text-slate-200">Freight / BCN / BOXN</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-1 bg-[#EF4444] rounded inline-block" />
                <span className="text-red-400 font-semibold">Delayed (&gt;15m)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-1 border-b-2 border-emerald-400 border-dashed inline-block" />
                <span className="text-emerald-400">What-If Plan</span>
              </div>
            </div>
          </div>

          {/* Conflict Symbols */}
          <div>
            <div className="text-slate-400 font-bold mb-1.5 uppercase text-[9px] tracking-wider">Operational Conflict Markers</div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-red-500 font-bold text-xs">◆</span>
                <span className="text-slate-300">Crossing / Platform</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-amber-500 font-bold text-xs">▲</span>
                <span className="text-slate-300">Overtaking / Precedence</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400 font-bold text-xs">⚠</span>
                <span className="text-slate-300">Headway / Line Block</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-emerald-400 font-bold text-xs">◇</span>
                <span className="text-slate-300">AI Hold / Recommendation</span>
              </div>
            </div>
          </div>

          {/* Topology & Stops */}
          <div>
            <div className="text-slate-400 font-bold mb-1.5 uppercase text-[9px] tracking-wider">Topology & Dwell Features</div>
            <div className="grid grid-cols-2 gap-1.5 text-slate-300">
              <div className="flex items-center space-x-1.5">
                <span className="text-amber-400 font-bold">◆</span>
                <span>Junction Station</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>Wayside / Halt</span>
              </div>
              <div className="flex items-center space-x-1.5 col-span-2">
                <span className="w-4 h-0.5 bg-white inline-block"></span>
                <span>Horizontal Bar = Scheduled Dwell Halt</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
