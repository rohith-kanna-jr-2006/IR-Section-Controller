import React from 'react';

/**
 * ScopeBreadcrumb
 * 
 * Prominently displays the canonical active operational territory ribbon:
 * INDIAN RAILWAYS › ZONE › DIVISION › ROUTE › SECTION › SERVICE DAY › SCENARIO
 */
export default function ScopeBreadcrumb({
  zoneName = '',
  divisionName = '',
  routeName = '',
  sectionName = '',
  sectionOrRouteName = '',
  serviceDate = '2026-08-30',
  scenarioName = '',
  isLoaded = true
}) {
  const formattedDate = serviceDate ? new Date(serviceDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).toUpperCase() : 'TODAY';

  const resolvedRoute = routeName || sectionOrRouteName || '';
  const resolvedSection = sectionName && sectionName !== 'ALL_SECTIONS' ? sectionName : '';

  return (
    <nav aria-label="Operational Territory Hierarchy" className="flex items-center flex-wrap gap-1.5 text-[11px] font-mono font-bold tracking-wide text-slate-300 py-1">
      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 font-extrabold flex items-center space-x-1 shadow-sm">
        <span>INDIAN RAILWAYS</span>
      </span>
      <span className="text-slate-600 font-bold">›</span>
      <span className="text-slate-200 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
        {zoneName ? zoneName.toUpperCase() : 'ALL ZONES'}
      </span>
      <span className="text-slate-600 font-bold">›</span>
      <span className="text-slate-200 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
        {divisionName ? divisionName.toUpperCase() : 'ALL DIVISIONS'}
      </span>
      <span className="text-slate-600 font-bold">›</span>
      <span className="text-cyan-300 font-semibold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/60">
        {resolvedRoute ? resolvedRoute.toUpperCase() : 'ALL CORRIDORS'}
      </span>
      {resolvedSection && (
        <>
          <span className="text-slate-600 font-bold">›</span>
          <span className="text-cyan-200 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/80">
            {resolvedSection.toUpperCase()}
          </span>
        </>
      )}
      <span className="text-slate-600 font-bold">›</span>
      <span className="text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded text-[10px]">
        {formattedDate}
      </span>
      {scenarioName && (
        <>
          <span className="text-slate-600 font-bold">›</span>
          <span className="text-indigo-300 bg-indigo-950/60 border border-indigo-800/80 px-2 py-0.5 rounded text-[10px]">
            {scenarioName.toUpperCase()}
          </span>
        </>
      )}
      {isLoaded && (
        <span className="ml-1 px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[9px] font-bold tracking-wider flex items-center space-x-1 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>ACTIVE SCOPE</span>
        </span>
      )}
    </nav>
  );
}
