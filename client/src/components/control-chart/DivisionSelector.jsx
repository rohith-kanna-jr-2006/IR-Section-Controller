import React from 'react';

/**
 * DivisionSelector
 * 
 * Displays Divisions filtered by selected Railway Zone.
 * Step 02 in the canonical controller hierarchy.
 */
export default function DivisionSelector({
  divisions = [],
  selectedDivisionId = '',
  onChange,
  disabled = false,
  isLoading = false,
  selectedZoneId = ''
}) {
  const isZoneChosen = Boolean(selectedZoneId);
  const isSelected = Boolean(selectedDivisionId);

  return (
    <div className={`flex flex-col space-y-1.5 p-2 rounded-lg border transition-all ${
      !isZoneChosen 
        ? 'bg-slate-900/40 border-slate-800/60 opacity-60' 
        : isSelected 
        ? 'bg-slate-900/90 border-cyan-700/60 shadow-[0_0_10px_rgba(6,182,212,0.08)]' 
        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
    }`}>
      <div className="flex items-center justify-between">
        <label htmlFor="division-selector" className="flex items-center space-x-1.5 text-[11px] font-bold tracking-wider uppercase cursor-pointer">
          <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded ${
            isSelected 
              ? 'bg-cyan-500 text-slate-950' 
              : isZoneChosen 
              ? 'bg-slate-800 text-cyan-400 border border-slate-700' 
              : 'bg-slate-800 text-slate-500'
          }`}>
            02
          </span>
          <span className={isSelected ? 'text-cyan-300' : isZoneChosen ? 'text-slate-300' : 'text-slate-500'}>
            Division
          </span>
        </label>
        {isSelected && (
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
        )}
      </div>

      <div className="relative">
        <select
          id="division-selector"
          value={selectedDivisionId}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || !isZoneChosen || isLoading}
          aria-label="Railway Division Selector"
          className="w-full appearance-none bg-slate-950/90 border border-slate-700/80 text-slate-100 text-xs rounded-md pl-2.5 pr-7 py-2 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 disabled:opacity-40 disabled:cursor-not-allowed font-mono transition-all truncate cursor-pointer hover:border-slate-600"
        >
          {!isZoneChosen ? (
            <option value="" className="bg-slate-900 text-slate-500">-- Select Zone First --</option>
          ) : divisions.length === 0 ? (
            <option value="" className="bg-slate-900 text-slate-400">-- No Divisions Available --</option>
          ) : (
            <>
              <option value="" className="bg-slate-900 text-slate-400">-- Select Division (or All) --</option>
              <option value="ALL_DIVISION" className="bg-slate-900 text-cyan-300 font-semibold">🌐 ALL DIVISIONS IN ZONE</option>
              {divisions.map((div) => {
                const dId = div._id || div.id || div.code;
                return (
                  <option key={`div-${dId}`} value={dId} className="bg-slate-900 text-slate-100">
                    {div.code} - {div.name} Division
                  </option>
                );
              })}
            </>
          )}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {isZoneChosen && divisions.length === 0 && !isLoading && (
        <span className="text-[10px] text-amber-400 font-sans">
          No divisions are available for this zone.
        </span>
      )}
    </div>
  );
}

