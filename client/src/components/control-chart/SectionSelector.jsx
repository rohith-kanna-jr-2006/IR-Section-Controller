import React from 'react';

/**
 * SectionSelector
 * 
 * Displays railway block sections within the selected Route / Division.
 * Displays Section Code, From Station, To Station, and Data Provenance.
 * Step 04 in the canonical controller hierarchy.
 */
export default function SectionSelector({
  sections = [],
  selectedSectionId = '',
  onChange,
  disabled = false,
  isLoading = false,
  selectedDivisionId = '',
  selectedRouteId = ''
}) {
  const isPrereqChosen = Boolean(selectedDivisionId);
  const isSelected = Boolean(selectedSectionId && selectedSectionId !== 'ALL_SECTIONS');

  return (
    <div className={`flex flex-col space-y-1.5 p-2 rounded-lg border transition-all ${
      !isPrereqChosen 
        ? 'bg-slate-900/40 border-slate-800/60 opacity-60' 
        : isSelected 
        ? 'bg-slate-900/90 border-cyan-700/60 shadow-[0_0_10px_rgba(6,182,212,0.08)]' 
        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
    }`}>
      <div className="flex items-center justify-between">
        <label htmlFor="section-selector" className="flex items-center space-x-1.5 text-[11px] font-bold tracking-wider uppercase cursor-pointer">
          <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded ${
            isSelected 
              ? 'bg-cyan-500 text-slate-950' 
              : isPrereqChosen 
              ? 'bg-slate-800 text-cyan-400 border border-slate-700' 
              : 'bg-slate-800 text-slate-500'
          }`}>
            04
          </span>
          <span className={isSelected ? 'text-cyan-300' : isPrereqChosen ? 'text-slate-300' : 'text-slate-500'}>
            Block Section
          </span>
        </label>
        {isSelected && (
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
        )}
      </div>

      <div className="relative">
        <select
          id="section-selector"
          value={selectedSectionId}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || !isPrereqChosen || isLoading}
          aria-label="Railway Block Section Selector"
          className="w-full appearance-none bg-slate-950/90 border border-slate-700/80 text-slate-100 text-xs rounded-md pl-2.5 pr-7 py-2 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 disabled:opacity-40 disabled:cursor-not-allowed font-mono transition-all truncate cursor-pointer hover:border-slate-600"
        >
          {!isPrereqChosen ? (
            <option value="" className="bg-slate-900 text-slate-500">-- Select Division First --</option>
          ) : sections.length === 0 ? (
            <option value="" className="bg-slate-900 text-slate-400">-- All Sections in Corridor --</option>
          ) : (
            <>
              <option value="" className="bg-slate-900 text-slate-400">-- All Sections in Corridor --</option>
              <option value="ALL_SECTIONS" className="bg-slate-900 text-cyan-300 font-semibold">🌐 ALL SECTIONS IN CORRIDOR</option>
              {sections.map((sec) => {
                const sId = sec._id || sec.id || sec.sectionCode || sec.routeName;
                const label = sec.sectionCode || sec.routeName || `${sec.fromStationCode || sec.fromStationId?.stationCode || 'STN1'}–${sec.toStationCode || sec.toStationId?.stationCode || 'STN2'}`;
                const isReference = sec.isCandidate || sec.sourceType === 'REFERENCE' || sec.status === 'REFERENCE';
                
                return (
                  <option key={`sec-${sId}`} value={sId} className="bg-slate-900 text-slate-100">
                    {label} {isReference ? ' [SECONDARY REFERENCE]' : ' [VERIFIED]'}
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
    </div>
  );
}

