import React from 'react';

/**
 * ScenarioSelector
 * 
 * Fetches and displays available simulation scenarios.
 * Displays Scenario ID, Name, and Status Badge.
 * Step 06 in the canonical controller hierarchy.
 */
export default function ScenarioSelector({
  scenarios = [],
  selectedScenarioId = '',
  onChange,
  disabled = false,
  isLoading = false
}) {
  const isSelected = Boolean(selectedScenarioId);

  return (
    <div className={`flex flex-col space-y-1.5 p-2 rounded-lg border transition-all ${
      isSelected 
        ? 'bg-slate-900/90 border-indigo-700/60 shadow-[0_0_10px_rgba(99,102,241,0.08)]' 
        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
    }`}>
      <div className="flex items-center justify-between">
        <label htmlFor="scenario-selector" className="flex items-center space-x-1.5 text-[11px] font-bold tracking-wider uppercase cursor-pointer">
          <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded ${
            isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-indigo-400 border border-slate-700'
          }`}>
            06
          </span>
          <span className={isSelected ? 'text-indigo-300' : 'text-slate-300'}>
            Scenario
          </span>
        </label>
        {isSelected && (
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_#818cf8]"></span>
        )}
      </div>

      <div className="relative">
        <select
          id="scenario-selector"
          value={selectedScenarioId}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isLoading}
          aria-label="Simulation Scenario Selector"
          className="w-full appearance-none bg-slate-950/90 border border-slate-700/80 text-slate-100 text-xs rounded-md pl-2.5 pr-7 py-2 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 disabled:opacity-50 font-mono transition-all truncate cursor-pointer hover:border-slate-600"
        >
          <option value="" className="bg-slate-900 text-slate-400">-- Select Scenario --</option>
          {scenarios.map((scen) => {
            const sId = scen.scenarioId || scen._id || scen.id;
            const status = scen.status || 'READY';
            return (
              <option key={`scen-${sId}`} value={sId} className="bg-slate-900 text-slate-100">
                {scen.name || sId} [{status}]
              </option>
            );
          })}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

