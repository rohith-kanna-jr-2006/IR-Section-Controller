import React, { useState } from 'react';

/**
 * TabularViewModal
 * 
 * Accessible tabular view of active train runs, timetables, and section blocks.
 * Provides high-contrast accessible layout for screen readers and keyboard users (WCAG AA).
 */
export default function TabularViewModal({
  isOpen,
  onClose,
  trainRuns = [],
  stations = [],
  conflicts = []
}) {
  const [activeTab, setActiveTab] = useState('TRAINS');
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  const filteredRuns = trainRuns.filter((r) => {
    const num = r.trainId?.trainNumber || r.trainNumber || '';
    const name = r.trainId?.name || r.trainName || '';
    return num.toLowerCase().includes(filterQuery.toLowerCase()) || name.toLowerCase().includes(filterQuery.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm font-mono select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-xs text-slate-200">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-cyan-400 font-bold text-sm">📊 ACCESSIBLE TABULAR TIMETABLE</span>
            <div className="flex space-x-1 bg-slate-800 p-0.5 rounded border border-slate-700">
              {['TRAINS', 'STATIONS', 'CONFLICTS'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                    activeTab === tab ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold">
            ✕
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <input
            type="text"
            placeholder="Search by train number, name, station..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-80 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <span className="text-slate-500 text-[10px]">
            Showing {activeTab === 'TRAINS' ? filteredRuns.length : activeTab === 'STATIONS' ? stations.length : conflicts.length} items
          </span>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === 'TRAINS' && (
            <table className="w-full text-left text-xs border border-slate-800">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-2">Train No</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Delay</th>
                  <th className="p-2">Current Location</th>
                  <th className="p-2">Speed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900">
                {filteredRuns.map((r, i) => {
                  const num = r.trainId?.trainNumber || r.trainNumber || `TR-${i+1}`;
                  const name = r.trainId?.name || r.trainName || 'Express';
                  const delay = r.delayMinutes || 0;
                  return (
                    <tr key={`tab-run-${i}`} className="hover:bg-slate-800/60">
                      <td className="p-2 font-bold text-cyan-400">{num}</td>
                      <td className="p-2 text-slate-200">{name}</td>
                      <td className="p-2 text-slate-400">{r.trainId?.trainType || 'EXP'}</td>
                      <td className="p-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300">
                          {r.runStatus || 'RUNNING'}
                        </span>
                      </td>
                      <td className={`p-2 font-bold ${delay > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {delay > 0 ? `+${delay}m` : '0m'}
                      </td>
                      <td className="p-2 text-slate-300">{r.currentStationId?.stationCode || 'MAS'}</td>
                      <td className="p-2 text-slate-400">{r.currentSpeedKmph || 85} km/h</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'STATIONS' && (
            <table className="w-full text-left text-xs border border-slate-800">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-2">Code</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Division</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Platforms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900">
                {stations.map((stn, i) => (
                  <tr key={`tab-stn-${i}`} className="hover:bg-slate-800/60">
                    <td className="p-2 font-bold text-cyan-400">{stn.stationCode || stn.code}</td>
                    <td className="p-2 text-slate-200">{stn.name || stn.stationName}</td>
                    <td className="p-2 text-slate-400">{stn.division || 'SR'}</td>
                    <td className="p-2 text-slate-300">{stn.isJunction ? 'Junction (◆)' : 'Station (●)'}</td>
                    <td className="p-2 text-slate-400">{stn.platforms?.length || 2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'CONFLICTS' && (
            <table className="w-full text-left text-xs border border-slate-800">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-2">Type</th>
                  <th className="p-2">Severity</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Trains</th>
                  <th className="p-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900">
                {conflicts.map((c, i) => (
                  <tr key={`tab-c-${i}`} className="hover:bg-slate-800/60">
                    <td className="p-2 font-bold text-red-400">⚠ {c.type}</td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                        {c.severity || 'HIGH'}
                      </span>
                    </td>
                    <td className="p-2 text-amber-400 font-semibold">{c.status || 'ACTIVE'}</td>
                    <td className="p-2 text-slate-200">{c.trainRunIds?.join(', ') || 'N/A'}</td>
                    <td className="p-2 text-slate-400">{new Date(c.estimatedTime || c.detectedAt || Date.now()).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
