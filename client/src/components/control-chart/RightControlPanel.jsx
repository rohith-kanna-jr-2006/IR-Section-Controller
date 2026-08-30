import React, { useState } from 'react';

/**
 * RightControlPanel
 * 
 * Multi-tab operational sidebar for:
 * 1. Active Conflicts & Resolving (Crossing, Overtaking, Headway, Route-locking)
 * 2. Dispatch Recommendations (AI / Rule-based with confidence score & What-If)
 * 3. Train Timetable Inspector (with Cross-Division boundaries & schedule table)
 * 4. Section Block Inspector (with data provenance & length)
 * 5. Simulation Event Log
 */
export default function RightControlPanel({
  isOpen,
  onToggle,
  conflicts = [],
  recommendations = [],
  events = [],
  selectedTrain,
  selectedSection,
  selectedConflict,
  onSelectConflict,
  onSelectTrain,
  onAcknowledgeConflict,
  onResolveConflict,
  onApproveRecommendation,
  onWhatIfRecommendation,
  onWhatIfTrain
}) {
  const [activeTab, setActiveTab] = useState('CONFLICTS');
  const [showFullCrossRoute, setShowFullCrossRoute] = useState(false);

  return (
    <aside
      aria-label="Operations and Inspector Sidebar"
      className={`h-full bg-slate-900 border-l border-slate-700 flex flex-col text-xs font-mono text-slate-200 transition-all duration-200 z-30 ${
        isOpen ? 'w-80' : 'w-10'
      }`}
    >
      {/* Header / Tab Bar */}
      <div className="p-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <button
          onClick={onToggle}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
          title={isOpen ? 'Collapse Panel' : 'Expand Panel'}
          aria-label={isOpen ? 'Collapse Panel' : 'Expand Panel'}
        >
          {isOpen ? '▶' : '◀'}
        </button>

        {isOpen && (
          <div className="flex items-center space-x-1 flex-1 ml-2">
            {[
              { id: 'CONFLICTS', label: `CONFLICTS (${conflicts.length})`, alert: conflicts.length > 0 },
              { id: 'RECS', label: `RECS (${recommendations.length})` },
              { id: 'INSPECTOR', label: 'INSPECT' },
              { id: 'LOGS', label: 'LOGS' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                  activeTab === tab.id
                    ? tab.alert ? 'bg-red-900/60 text-red-200 border border-red-700' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="p-3 flex-1 overflow-y-auto space-y-3">
          {/* TAB 1: CONFLICTS */}
          {activeTab === 'CONFLICTS' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>ACTIVE CONFLICTS</span>
                <span className="text-red-400">{conflicts.length} DETECTED</span>
              </div>

              {conflicts.length === 0 ? (
                <div className="p-4 text-center text-slate-500 bg-slate-950 rounded border border-slate-800">
                  ✔ No active conflicts detected in current section window.
                </div>
              ) : (
                conflicts.map((c) => {
                  const cId = c._id || c.id || c.conflictId;
                  const isSel = selectedConflict?._id === c._id || selectedConflict?.conflictId === c.conflictId;
                  const isCrossing = (c.type || '').includes('CROSSING');
                  const isOvertake = (c.type || '').includes('OVERTAKE') || (c.type || '').includes('PRECEDENCE');

                  return (
                    <div
                      key={`conf-card-${cId}`}
                      onClick={() => onSelectConflict && onSelectConflict(c)}
                      className={`p-2.5 rounded border transition-all cursor-pointer ${
                        isSel
                          ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-red-400 text-[11px] flex items-center space-x-1">
                          <span>{isCrossing ? '🔴' : isOvertake ? '🟠' : '⚠'}</span>
                          <span>{c.type || 'PRECEDENCE CONFLICT'}</span>
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-red-950 text-red-300 border border-red-800">
                          {c.severity || 'HIGH'}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 space-y-0.5 mb-2">
                        <div>
                          Trains: <span className="text-slate-200 font-semibold">{c.trainRunIds?.join(' × ') || c.trainNumber || '12601 × 12604'}</span>
                        </div>
                        <div>
                          Location: <span className="text-slate-200">{c.stationId?.stationCode || c.sectionId?.sectionCode || 'KPD–JTJ Block'}</span>
                        </div>
                        <div>
                          Estimated Time: <span className="text-cyan-400">{new Date(c.estimatedTime || c.detectedAt || Date.now()).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1.5 pt-1 border-t border-slate-900">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAcknowledgeConflict && onAcknowledgeConflict(c);
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[10px] font-semibold flex-1"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onResolveConflict && onResolveConflict(c);
                          }}
                          className="px-2 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 rounded text-[10px] font-semibold flex-1 border border-emerald-700"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: RECOMMENDATIONS */}
          {activeTab === 'RECS' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>AI / DISPATCH RECOMMENDATIONS</span>
                <span className="text-emerald-400">{recommendations.length} AVAILABLE</span>
              </div>

              {recommendations.length === 0 ? (
                <div className="p-4 text-center text-slate-500 bg-slate-950 rounded border border-slate-800">
                  No pending recommendations. Section running at optimal baseline.
                </div>
              ) : (
                recommendations.map((rec) => {
                  const rId = rec._id || rec.id || rec.recommendationId;
                  const isApproved = rec.status === 'APPROVED';

                  return (
                    <div
                      key={`rec-card-${rId}`}
                      className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400 text-[11px] flex items-center space-x-1">
                          <span>◇</span>
                          <span>{rec.type || 'HOLD & PRECEDENCE'}</span>
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {rec.recommendationScore || 92}% CONF
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-300 leading-relaxed">
                        {rec.actionPayload?.reason || rec.evidence?.triggeringConflicts?.[0] || 'Hold lower-priority train at station loop to clear high-speed Vande Bharat corridor.'}
                      </p>

                      <div className="flex items-center space-x-1.5 pt-1 border-t border-slate-900">
                        <button
                          onClick={() => onWhatIfRecommendation && onWhatIfRecommendation(rec)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] font-semibold flex-1"
                        >
                          ⚡ Run What-If
                        </button>
                        <button
                          disabled={isApproved}
                          onClick={() => onApproveRecommendation && onApproveRecommendation(rec)}
                          className={`px-2 py-1 rounded text-[10px] font-semibold flex-1 ${
                            isApproved
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-emerald-700 hover:bg-emerald-600 text-white font-bold'
                          }`}
                        >
                          {isApproved ? 'Approved ✔' : 'Approve (Sim)'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: INSPECTOR */}
          {activeTab === 'INSPECTOR' && (
            <div className="space-y-3">
              {selectedTrain ? (
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-2">
                    <div>
                      <span className="font-bold text-cyan-400 text-sm">
                        {selectedTrain.trainId?.trainNumber || selectedTrain.trainNumber || 'TRAIN'}
                      </span>
                      <div className="text-slate-300 font-semibold text-[11px]">
                        {selectedTrain.trainId?.name || selectedTrain.trainName || 'Express Service'}
                      </div>
                    </div>
                    <button
                      onClick={() => onWhatIfTrain && onWhatIfTrain(selectedTrain)}
                      className="px-2 py-0.5 bg-emerald-900/60 text-emerald-300 rounded border border-emerald-700 text-[10px] font-bold"
                    >
                      ⚡ What-If
                    </button>
                  </div>

                  {/* Cross-Division Traversal Ribbon */}
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded mb-2 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
                      <span>TERRITORY TRAVERSAL</span>
                      <button
                        onClick={() => setShowFullCrossRoute(!showFullCrossRoute)}
                        className="text-cyan-400 hover:underline text-[9px]"
                      >
                        {showFullCrossRoute ? 'Scope View' : 'View Full Route'}
                      </button>
                    </div>
                    <div className="flex items-center space-x-1 text-[9px] text-slate-300 font-mono overflow-x-auto py-0.5">
                      <span className="bg-slate-800 px-1 py-0.5 rounded text-slate-400">MAS Division</span>
                      <span>→</span>
                      <span className="bg-cyan-950 text-cyan-300 px-1 py-0.5 rounded font-bold border border-cyan-800">
                        ACTIVE SCOPE
                      </span>
                      <span>→</span>
                      <span className="bg-slate-800 px-1 py-0.5 rounded text-slate-400">SA Division</span>
                    </div>
                    <div className="text-[9px] text-slate-500">
                      Entry: MAS (06:00) | Exit: JTJ (08:50)
                    </div>
                  </div>

                  {/* Stop Schedule Table */}
                  <div className="border border-slate-800 rounded overflow-hidden">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-1.5">STN</th>
                          <th className="p-1.5">ARR</th>
                          <th className="p-1.5">DEP</th>
                          <th className="p-1.5">HALT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900">
                        {(selectedTrain.stops || []).map((st, i) => (
                          <tr key={`st-row-${i}`} className="hover:bg-slate-800/50">
                            <td className="p-1.5 font-bold text-slate-200">{st.stationCode || st.stationId?.stationCode || `STN-${i+1}`}</td>
                            <td className="p-1.5 text-slate-400">{st.arrival || '--:--'}</td>
                            <td className="p-1.5 text-cyan-400 font-semibold">{st.departure || '--:--'}</td>
                            <td className="p-1.5 text-slate-400">{st.haltMinutes ? `${st.haltMinutes}m` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : selectedSection ? (
                <div>
                  <div className="font-bold text-cyan-400 text-sm mb-1">
                    {selectedSection.sectionCode || selectedSection.routeName || 'BLOCK SECTION'}
                  </div>
                  <div className="text-[10px] text-slate-400 space-y-1 bg-slate-950 p-2.5 rounded border border-slate-800">
                    <div>Length: <span className="text-slate-200">{selectedSection.distanceKm || 10} km</span></div>
                    <div>Max Speed: <span className="text-slate-200">{selectedSection.maxSpeedKmph || 130} km/h</span></div>
                    <div>Type: <span className="text-slate-200">{selectedSection.trackType || 'DOUBLE_TRACK'}</span></div>
                    <div>Signaling: <span className="text-slate-200">{selectedSection.signalingType || 'AUTOMATIC_BLOCK'}</span></div>
                    <div className="pt-1 border-t border-slate-800 text-[9px] text-amber-400">
                      Data Provenance: {selectedSection.isCandidate ? 'SECONDARY REFERENCE (Ingested)' : 'PRIMARY VERIFIED'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500 bg-slate-950 rounded border border-slate-800">
                  Click any train line, station, or section to inspect detailed operational metrics.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LOGS */}
          {activeTab === 'LOGS' && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400 mb-2">CONTROL EVENT AUDIT TRAIL</div>
              {events.length === 0 ? (
                <div className="text-slate-500 text-center py-4">No events logged yet.</div>
              ) : (
                events.map((ev, idx) => (
                  <div key={`ev-${idx}`} className="p-1.5 bg-slate-950 rounded border border-slate-800/80 text-[10px]">
                    <div className="flex justify-between text-slate-500">
                      <span className="font-bold text-slate-400">{ev.eventType || 'EVENT'}</span>
                      <span>{new Date(ev.timestamp || Date.now()).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-300 mt-0.5">{ev.message || JSON.stringify(ev.payload || {})}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
