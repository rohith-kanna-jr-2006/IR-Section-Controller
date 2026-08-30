import React from 'react';

/**
 * ZoneSelector
 * 
 * Fetches and displays Indian Railways Zones from the API.
 * Displays Zone Code, Zone Name, and Headquarters.
 */
export default function ZoneSelector({
  zones = [],
  selectedZoneId = '',
  onChange,
  disabled = false,
  isLoading = false
}) {
  return (
    <div className="flex flex-col space-y-1">
      <label htmlFor="zone-selector" className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
        1. Railway Zone
      </label>
      <select
        id="zone-selector"
        value={selectedZoneId}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading}
        aria-label="Railway Zone Selector"
        className="bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 disabled:opacity-50 font-mono transition-colors"
      >
        <option value="">-- Select Zone (or All India) --</option>
        <option value="ALL_INDIA">🌐 ALL INDIA NETWORK</option>
        {zones.map((zone) => {
          const zId = zone._id || zone.id || zone.code;
          return (
            <option key={`zone-${zId}`} value={zId}>
              {zone.code} - {zone.name} {zone.headquarters ? `(HQ: ${zone.headquarters})` : ''}
            </option>
          );
        })}
      </select>
    </div>
  );
}
