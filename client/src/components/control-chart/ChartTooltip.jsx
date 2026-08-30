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
      className="fixed z-50 pointer-events-none bg-slate-950/95 border border-slate-700 shadow-2xl rounded-lg p-3 text-xs font-mono text-slate-200 max-w-sm backdrop-blur-md"
      style={{
        left: `${Math.min(position.x + 15, window.innerWidth - 340)}px`,
        top: `${Math.min(position.y + 15, window.innerHeight - 260)}px`
      }}
    >
      {type === 'TRAIN' && (
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-cyan-400 text-sm">
                {payload.direction === 'UP' ? '▲' : '▼'} {payload.trainId?.trainNumber || payload.trainNumber || 'TRAIN'}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-semibold">
                {payload.direction || 'DOWN'}
              </span>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              (payload.delayMinutes || 0) > 15 
                ? 'bg-red-950 text-red-400 border border-red-800' 
                : (payload.delayMinutes || 0) > 0 
                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}>
              {(payload.delayMinutes || 0) > 0 ? `+${payload.delayMinutes}m LATE` : 'ON TIME (RT)'}
            </span>
          </div>

          <div className="text-slate-200 font-semibold mb-1 text-[11px] leading-tight">
            {payload.trainId?.name || payload.trainName || 'Express Service'}
          </div>

          {payload.originStation && payload.destinationStation && (
            <div className="text-[10px] text-slate-400 mb-2 border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-300">{payload.originStation}</span> ({payload.originCode || 'ORG'}) → <span className="text-slate-300">{payload.destinationStation}</span> ({payload.destinationCode || 'DST'})
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-400 mt-1">
            <div>Class: <span className="text-slate-200 font-bold">{payload.trainType || payload.trainId?.trainType || 'EXPRESS'}</span></div>
            <div>Status: <span className="text-cyan-300 font-semibold">{payload.runStatus || 'RUNNING'}</span></div>
            <div>Speed: <span className="text-slate-200 font-bold">{payload.currentSpeedKmph || 85} km/h</span></div>
            <div>MPS: <span className="text-amber-300">{payload.maxPermissibleSpeed || 110} km/h</span></div>
            <div>Loco / Rake: <span className="text-slate-300">{payload.locoType || payload.rakeType || 'WAP-7 RPM'}</span></div>
            <div>Priority: <span className="text-emerald-400 font-bold">{payload.priorityClass || 'HIGH'}</span></div>
          </div>
        </div>
      )}

      {type === 'STATION' && (
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-cyan-400 text-sm">{payload.stationCode || payload.code}</span>
            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
              {payload.division || 'SR'} DIVISION
            </span>
          </div>
          <div className="text-slate-200 font-semibold mb-1 text-xs">{payload.name || payload.stationName}</div>
          <div className="text-[10px] text-slate-400 space-y-1 mt-2">
            <div>Type: <span className="text-slate-200 font-bold">{payload.isJunction ? 'Junction Interlocking (◆)' : payload.isTerminal ? 'Terminal Station (■)' : 'Block Station (●)'}</span></div>
            <div>Distance: <span className="text-amber-400 font-bold">{payload.cumulativeKm !== undefined ? `${payload.cumulativeKm} KM` : '0 KM'}</span></div>
            <div>Platforms: <span className="text-slate-200">{payload.platforms?.join(', ') || '1, 2'}</span></div>
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
          <div className="text-[10px] text-slate-400 space-y-1">
            <div>Trains Involved: <span className="text-slate-200 font-bold">{payload.trainRunIds?.join(', ') || payload.trainNumber || 'N/A'}</span></div>
            <div>Location: <span className="text-slate-200">{payload.stationCode || payload.stationId?.stationCode || payload.description || 'Station Junction'}</span></div>
            {payload.description && (
              <div className="text-slate-300 text-[10px] italic border-t border-slate-800 pt-1 mt-1">
                {payload.description}
              </div>
            )}
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
            Corridor: <span className="text-slate-200">{payload.routeName || payload.name || 'Double Track Block'}</span>
          </div>
          <div className="text-[10px] text-slate-400 space-y-0.5">
            <div>Track Type: <span className="text-slate-200">{payload.trackType || 'DOUBLE_TRACK'}</span></div>
            <div>Signaling: <span className="text-slate-200">{payload.signalingType || 'AUTOMATIC_BLOCK'}</span></div>
            <div>Max Speed: <span className="text-slate-200 font-bold">{payload.maxSpeedKmph || 130} km/h</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
