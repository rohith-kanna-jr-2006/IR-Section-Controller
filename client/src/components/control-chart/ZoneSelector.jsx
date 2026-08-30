import React from 'react';

/**
 * ZoneSelector
 * 
 * Fetches and displays Indian Railways Zones from the API.
 * Step 01 in the canonical controller hierarchy.
 */
export default function ZoneSelector({
  zones = [],
  selectedZoneId = '',
  onChange,
  disabled = false,
  isLoading = false
}) {
  const isSelected = Boolean(selectedZoneId);

  return (
    <div className={`flex flex-col space-y-1.5 p-2 rounded-lg border transition-all ${
      isSelected 
        ? 'bg-slate-900/90 border-cyan-700/60 shadow-[0_0_10px_rgba(6,182,212,0.08)]' 
        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
    }`}>
      <div className="flex items-center justify-between">
        <label htmlFor="zone-selector" className="flex items-center space-x-1.5 text-[11px] font-bold tracking-wider uppercase cursor-pointer">
          <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded ${
            isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400 border border-slate-700'
          }`}>
            01
          </span>
          <span className={isSelected ? 'text-cyan-300' : 'text-slate-300'}>
            Railway Zone
          </span>
        </label>
        {isSelected && (
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
        )}
      </div>

      <div className="relative">
        <select
          id="zone-selector"
          value={selectedZoneId}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isLoading}
          aria-label="Railway Zone Selector"
          className="w-full appearance-none bg-slate-950/90 border border-slate-700/80 text-slate-100 text-xs rounded-md pl-2.5 pr-7 py-2 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 disabled:opacity-50 font-mono transition-all truncate cursor-pointer hover:border-slate-600"
        >
          <option value="" className="bg-slate-900 text-slate-400">-- Select Zone (or All India) --</option>
          <option value="ALL_INDIA" className="bg-slate-900 text-cyan-300 font-semibold">🌐 ALL INDIA NETWORK</option>
          {zones.map((zone) => {
            const zId = zone._id || zone.id || zone.code;
            return (
              <option key={`zone-${zId}`} value={zId} className="bg-slate-900 text-slate-100">
                {zone.code} - {zone.name} {zone.headquarters ? `(HQ: ${zone.headquarters})` : ''}
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

