import React from 'react';

/**
 * SectionSelector
 * 
 * Displays railway block sections within the selected Division/Zone.
 * Displays Section Code, From Station, To Station, and Data Provenance.
 */
export default function SectionSelector({
  sections = [],
  selectedSectionId = '',
  onChange,
  disabled = false,
  isLoading = false,
  selectedDivisionId = ''
}) {
  const isDivisionChosen = Boolean(selectedDivisionId);

  return (
    <div className="flex flex-col space-y-1">
      <label htmlFor="section-selector" className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
        3. Block Section
      </label>
      <select
        id="section-selector"
        value={selectedSectionId}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || !isDivisionChosen || isLoading}
        aria-label="Railway Block Section Selector"
        className="bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 disabled:opacity-50 font-mono transition-colors"
      >
        {!isDivisionChosen ? (
          <option value="">-- Select Division First --</option>
        ) : sections.length === 0 ? (
          <option value="">-- No Sections Available --</option>
        ) : (
          <>
            <option value="">-- Select Specific Section (Optional) --</option>
            <option value="ALL_SECTIONS">🌐 ALL SECTIONS IN CORRIDOR</option>
            {sections.map((sec) => {
              const sId = sec._id || sec.id || sec.sectionCode || sec.routeName;
              const label = sec.sectionCode || sec.routeName || `${sec.fromStationCode || sec.fromStationId?.stationCode || 'STN1'}–${sec.toStationCode || sec.toStationId?.stationCode || 'STN2'}`;
              const isReference = sec.isCandidate || sec.sourceType === 'REFERENCE' || sec.status === 'REFERENCE';
              
              return (
                <option key={`sec-${sId}`} value={sId}>
                  {label} {isReference ? ' [SECONDARY REFERENCE]' : ' [VERIFIED]'}
                </option>
              );
            })}
          </>
        )}
      </select>
      {isDivisionChosen && sections.length === 0 && !isLoading && (
        <span className="text-[10px] text-amber-400">
          No sections are available for this division.
        </span>
      )}
    </div>
  );
}
