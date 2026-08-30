import React from 'react';

/**
 * ScopeStatus
 * 
 * Displays comprehensive controller scope status and data provenance.
 * Never hides whether data is SECONDARY REFERENCE or VERIFIED.
 */
export default function ScopeStatus({
  zoneName = '',
  divisionName = '',
  sectionName = '',
  routeName = '',
  serviceDate = '',
  scenarioName = '',
  distanceMode = 'SCHEMATIC',
  isReferenceData = false,
  totalStations = 0,
  totalSections = 0,
  activeTrainsCount = 0
}) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded px-3 py-1.5 text-[10px] font-mono text-slate-300 flex flex-wrap items-center justify-between gap-y-1 gap-x-3">
      <div className="flex items-center space-x-2 flex-wrap">
        <span><strong className="text-slate-400">ZONE:</strong> {zoneName || 'SR'}</span>
        <span className="text-slate-600">|</span>
        <span><strong className="text-slate-400">DIV:</strong> {divisionName || 'MAS'}</span>
        <span className="text-slate-600">|</span>
        <span><strong className="text-slate-400">CORRIDOR:</strong> {routeName || sectionName || 'MAS-JTJ'}</span>
        <span className="text-slate-600">|</span>
        <span><strong className="text-slate-400">DATE:</strong> {serviceDate || '2026-08-30'}</span>
        <span className="text-slate-600">|</span>
        <span><strong className="text-slate-400">SCENARIO:</strong> {scenarioName || 'DEFAULT'}</span>
        <span className="text-slate-600">|</span>
        <span><strong className="text-slate-400">MODE:</strong> {distanceMode}</span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-slate-400">
          STATIONS: <span className="text-cyan-400 font-bold">{totalStations}</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">
          TRAINS: <span className="text-emerald-400 font-bold">{activeTrainsCount}</span>
        </span>
        <span className="text-slate-600">|</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
            isReferenceData
              ? 'bg-amber-950/80 text-amber-300 border-amber-800'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
          }`}
          title="Data Provenance Authority"
        >
          {isReferenceData ? '⚠ SECONDARY REFERENCE DATA' : '✔ VERIFIED TOPOLOGY'}
        </span>
      </div>
    </div>
  );
}
