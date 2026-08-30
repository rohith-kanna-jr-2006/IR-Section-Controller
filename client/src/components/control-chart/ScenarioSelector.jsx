import React from 'react';

/**
 * ScenarioSelector
 * 
 * Fetches and displays available simulation scenarios.
 * Displays Scenario ID, Name, and Status Badge.
 */
export default function ScenarioSelector({
  scenarios = [],
  selectedScenarioId = '',
  onChange,
  disabled = false,
  isLoading = false
}) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'RUNNING':
        return 'text-emerald-400';
      case 'PAUSED':
        return 'text-amber-400';
      case 'COMPLETED':
        return 'text-blue-400';
      case 'REPLAY':
        return 'text-purple-400';
      case 'READY':
        return 'text-cyan-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="flex flex-col space-y-1">
      <label htmlFor="scenario-selector" className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
        6. Operational Scenario
      </label>
      <select
        id="scenario-selector"
        value={selectedScenarioId}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading}
        aria-label="Simulation Scenario Selector"
        className="bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 disabled:opacity-50 font-mono transition-colors"
      >
        <option value="">-- Select Scenario --</option>
        {scenarios.map((scen) => {
          const sId = scen.scenarioId || scen._id || scen.id;
          const status = scen.status || 'READY';
          return (
            <option key={`scen-${sId}`} value={sId}>
              {scen.name || sId} [{status}]
            </option>
          );
        })}
      </select>
    </div>
  );
}
