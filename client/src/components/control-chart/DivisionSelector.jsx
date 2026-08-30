import React from 'react';

/**
 * DivisionSelector
 * 
 * Displays Divisions filtered by selected Railway Zone.
 * Displays Division Code, Division Name, and Zone.
 * Rejects or clears selection if Zone changes.
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

  return (
    <div className="flex flex-col space-y-1">
      <label htmlFor="division-selector" className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
        2. Division
      </label>
      <select
        id="division-selector"
        value={selectedDivisionId}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || !isZoneChosen || isLoading}
        aria-label="Railway Division Selector"
        className="bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 disabled:opacity-50 font-mono transition-colors"
      >
        {!isZoneChosen ? (
          <option value="">-- Select Zone First --</option>
        ) : divisions.length === 0 ? (
          <option value="">-- No Divisions Available --</option>
        ) : (
          <>
            <option value="">-- Select Division (or All in Zone) --</option>
            <option value="ALL_DIVISION">🌐 ALL DIVISIONS IN ZONE</option>
            {divisions.map((div) => {
              const dId = div._id || div.id || div.code;
              return (
                <option key={`div-${dId}`} value={dId}>
                  {div.code} - {div.name} Division
                </option>
              );
            })}
          </>
        )}
      </select>
      {isZoneChosen && divisions.length === 0 && !isLoading && (
        <span className="text-[10px] text-amber-400">
          No divisions are available for this zone.
        </span>
      )}
    </div>
  );
}
