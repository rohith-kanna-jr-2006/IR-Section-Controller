import React from 'react';

/**
 * ScopeBreadcrumb
 * 
 * Prominently displays the active operational territory ribbon:
 * INDIAN RAILWAYS › ZONE › DIVISION › SECTION/ROUTE › SERVICE DAY
 */
export default function ScopeBreadcrumb({
  zoneName = 'SOUTHERN RAILWAY (SR)',
  divisionName = 'CHENNAI DIVISION (MAS)',
  sectionOrRouteName = 'WEST LINE (MAS-JTJ)',
  serviceDate = '2026-08-30',
  isLoaded = true
}) {
  const formattedDate = serviceDate ? new Date(serviceDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).toUpperCase() : 'TODAY';

  return (
    <nav aria-label="Operational Territory Hierarchy" className="flex items-center space-x-1.5 text-[11px] font-mono font-bold tracking-wide text-slate-300 overflow-x-auto whitespace-nowrap py-1">
      <span className="text-cyan-400">INDIAN RAILWAYS</span>
      <span className="text-slate-600">›</span>
      <span className="text-slate-200">{zoneName || 'ALL ZONES'}</span>
      <span className="text-slate-600">›</span>
      <span className="text-slate-200">{divisionName || 'ALL DIVISIONS'}</span>
      <span className="text-slate-600">›</span>
      <span className="text-cyan-300 font-semibold">{sectionOrRouteName || 'ALL SECTIONS'}</span>
      <span className="text-slate-600">›</span>
      <span className="text-amber-300 bg-amber-950/60 border border-amber-800/80 px-1.5 py-0.2 rounded text-[10px]">
        SERVICE DAY: {formattedDate}
      </span>
      {isLoaded && (
        <span className="ml-2 px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[9px] font-bold">
          ● ACTIVE SCOPE
        </span>
      )}
    </nav>
  );
}
