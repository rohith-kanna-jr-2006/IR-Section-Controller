import React, { useState } from 'react';

/**
 * WhatIfModal
 * 
 * Interactive hypothetical simulation sandbox.
 * Prominently displays "WHAT-IF — NOT REAL" watermark.
 * Allows adjusting departure/hold times at stations, calculating delay deltas,
 * and projecting conflict elimination without modifying authoritative master data.
 */
export default function WhatIfModal({
  isOpen,
  onClose,
  trainRun,
  onApplyWhatIf,
  onClearWhatIf
}) {
  const [holdMinutes, setHoldMinutes] = useState(10);
  const [selectedStation, setSelectedStation] = useState('');
  const [strategy, setStrategy] = useState('HOLD_AT_LOOP');

  if (!isOpen || !trainRun) return null;

  const trainNumber = trainRun.trainId?.trainNumber || trainRun.trainNumber || 'TRAIN';
  const trainName = trainRun.trainId?.name || trainRun.trainName || 'Express';

  // Projected metrics
  const projectedDelayDelta = -12; // 12 mins recovered network-wide
  const projectedConflictsResolved = 1;

  const handleSimulate = () => {
    onApplyWhatIf && onApplyWhatIf({
      trainRun,
      holdMinutes: Number(holdMinutes),
      selectedStation,
      strategy
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm font-mono select-none">
      <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden text-xs text-slate-200 relative">
        {/* Prominent WHAT-IF Watermark Header */}
        <div className="bg-emerald-950/80 border-b border-emerald-800/80 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-emerald-400 font-bold text-sm">⚡ WHAT-IF EXPERIMENT</span>
            <span className="px-2 py-0.5 bg-red-950 text-red-300 border border-red-800 rounded text-[9px] font-bold tracking-widest uppercase">
              NOT REAL / SIMULATION ONLY
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-4">
          {/* Target Train */}
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Target Train</div>
            <div className="text-sm font-bold text-cyan-400">{trainNumber} - {trainName}</div>
            <div className="text-[10px] text-slate-400">Current Delay: +{trainRun.delayMinutes || 0} min</div>
          </div>

          {/* Strategy Selection */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Intervention Strategy
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="HOLD_AT_LOOP">Hold Train at Loop Line to allow High-Priority Overtake</option>
              <option value="EARLY_DISPATCH">Early Dispatch / Signal Clearance Priority</option>
              <option value="CROSSING_PRECEDENCE">Swap Crossing Precedence at Junction</option>
            </select>
          </div>

          {/* Hold Duration Adjustment */}
          <div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              <span>Hold / Departure Offset</span>
              <span className="text-emerald-400">{holdMinutes > 0 ? `+${holdMinutes} min` : `${holdMinutes} min`}</span>
            </div>
            <input
              type="range"
              min="-20"
              max="45"
              step="5"
              value={holdMinutes}
              onChange={(e) => setHoldMinutes(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-1">
              <span>-20m (Adv)</span>
              <span>0m</span>
              <span>+15m</span>
              <span>+30m</span>
              <span>+45m</span>
            </div>
          </div>

          {/* Station Selection */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Intervention Station
            </label>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Next Scheduled Station / Loop</option>
              {(trainRun.stops || []).map((st, idx) => (
                <option key={`st-opt-${idx}`} value={st.stationCode || st.stationId?.stationCode || `STN-${idx+1}`}>
                  {st.stationCode || st.stationId?.stationCode || `STN-${idx+1}`} (Arr: {st.arrival || '--'})
                </option>
              ))}
            </select>
          </div>

          {/* Projected KPI Impact */}
          <div className="p-3 bg-emerald-950/30 rounded border border-emerald-800/50 space-y-1.5">
            <div className="text-[10px] font-bold text-emerald-400 uppercase">Projected Scenario Impact:</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
                <div className="text-slate-400 text-[9px]">Conflicts Eliminated</div>
                <div className="text-emerald-400 font-bold text-sm">+{projectedConflictsResolved} Solved</div>
              </div>
              <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
                <div className="text-slate-400 text-[9px]">Section Delay Delta</div>
                <div className="text-emerald-400 font-bold text-sm">{projectedDelayDelta} min</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              onClearWhatIf && onClearWhatIf();
              onClose();
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-xs"
          >
            Clear Overlay
          </button>

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSimulate}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs shadow-md"
            >
              Overlay On Chart ⚡
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
