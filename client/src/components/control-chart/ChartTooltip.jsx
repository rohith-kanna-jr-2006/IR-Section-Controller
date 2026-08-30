import React from 'react';

/**
 * ChartTooltip
 * 
 * Floating tooltip providing dense operational metadata for hovered
 * trains, stations, conflicts, section occupancies, and AI recommendations.
 */
export default function ChartTooltip({ data, position }) {
  if (!data || !position) return null;

  const { type, payload } = data;

  return (
    <div
      className="fixed z-50 pointer-events-none bg-slate-950/95 border border-slate-700 shadow-2xl rounded p-3 text-xs font-mono text-slate-200 max-w-sm backdrop-blur-sm"
      style={{
        left: `${Math.min(position.x + 15, window.innerWidth - 320)}px`,
        top: `${Math.min(position.y + 15, window.innerHeight - 240)}px`
      }}
    >
      {type === 'TRAIN' && (
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-cyan-400 text-sm">
              {payload.trainId?.trainNumber || payload.trainNumber || 'TRAIN'}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              (payload.delayMinutes || 0) > 15 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}>
              {(payload.delayMinutes || 0) > 0 ? `+${payload.delayMinutes}m LATE` : 'ON TIME'}
            </span>
          </div>

          <div className="text-slate-300 font-semibold mb-1 text-[11px]">
            {payload.trainId?.name || payload.trainName || 'Express Service'}
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-400 mt-2">
            <div>Type: <span className="text-slate-200">{payload.trainId?.trainType || 'EXP'}</span></div>
            <div>Status: <span className="text-cyan-300">{payload.runStatus || 'RUNNING'}</span></div>
            <div>Speed: <span className="text-slate-200">{payload.currentSpeedKmph || 85} km/h</span></div>
            <div>Priority: <span className="text-amber-400 font-bold">{payload.priority || 1}</span></div>
            <div>Current Stn: <span className="text-slate-200">{payload.currentStationId?.stationCode || payload.currentStationId || 'MAS'}</span></div>
            <div>Next Stn: <span className="text-slate-200">{payload.nextStationId?.stationCode || payload.nextStationId || 'AJJ'}</span></div>
          </div>
        </div>
      )}

      {type === 'STATION' && (
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-cyan-400 text-sm">{payload.stationCode || payload.code}</span>
            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
              {payload.division || 'SR'} DIV
            </span>
          </div>
          <div className="text-slate-200 font-semibold mb-1">{payload.name || payload.stationName}</div>
          <div className="text-[10px] text-slate-400">
            <div>Type: <span className="text-slate-200">{payload.isJunction ? 'Junction (◆)' : 'Station (●)'}</span></div>
            <div>Platforms: <span className="text-slate-200">{payload.platforms?.length || payload.platformsCount || 2}</span></div>
          </div>
        </div>
      )}

      {type === 'CONFLICT' && (
        <div>
          <div className="flex items-center justify-between border-b border-red-900/50 pb-1.5 mb-2">
            <span className="font-bold text-red-400 text-sm">⚠ {payload.type || 'CONFLICT'}</span>
            <span className="bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
              {payload.severity || 'HIGH'}
            </span>
          </div>
          <div className="text-slate-300 text-[11px] mb-1">
            Status: <span className="text-amber-400 font-bold">{payload.status || 'ACTIVE'}</span>
          </div>
          <div className="text-[10px] text-slate-400 space-y-0.5">
            <div>Trains Involved: <span className="text-slate-200 font-bold">{payload.trainRunIds?.join(', ') || payload.trainIds?.join(', ') || 'N/A'}</span></div>
            <div>Location: <span className="text-slate-200">{payload.stationId?.stationCode || payload.sectionId?.sectionCode || payload.locationType || 'Section Block'}</span></div>
            <div>Detected: <span className="text-slate-200">{new Date(payload.detectedAt || Date.now()).toLocaleTimeString()}</span></div>
          </div>
        </div>
      )}

      {type === 'SECTION' && (
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-cyan-400 text-sm">{payload.sectionCode || payload.code || 'BLOCK SECTION'}</span>
            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
              {payload.distanceKm || 10} KM
            </span>
          </div>
          <div className="text-slate-300 text-[11px] mb-1">
            Corridor: <span className="text-slate-200">{payload.corridor || 'MAS - JTJ'}</span>
          </div>
          <div className="text-[10px] text-slate-400">
            <div>Track Type: <span className="text-slate-200">{payload.trackType || 'DOUBLE_TRACK'}</span></div>
            <div>Max Speed: <span className="text-slate-200">{payload.maxSpeedKmph || 130} km/h</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
