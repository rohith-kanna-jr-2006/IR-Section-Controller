import React from 'react';

/**
 * StationAxis
 * 
 * Renders the vertical station topology axis on the left of the Control Chart.
 * Preserves topological railway sequence, indicates junctions, distance mode,
 * and enables station inspection.
 */
export default function StationAxis({
  stations = [],
  coordinateModel,
  distanceMode,
  selectedStationId,
  onStationSelect,
  onStationHover
}) {
  return (
    <div className="w-56 bg-slate-900 border-r border-slate-700 select-none flex-shrink-0 flex flex-col font-mono text-xs z-20 shadow-md">
      {/* Header */}
      <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-slate-400 font-bold tracking-wider text-[11px]">TOPOLOGY AXIS</span>
          <div className="text-[10px] text-slate-500">
            {distanceMode === 'PHYSICAL_DISTANCE' ? 'PHYSICAL (KM)' : 'SCHEMATIC (SEQ)'}
          </div>
        </div>
        <span className="bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-slate-700">
          {stations.length} STNS
        </span>
      </div>

      {/* Station List Overlay / SVG */}
      <div className="relative flex-1 overflow-hidden">
        <svg className="w-full h-full overflow-visible">
          {stations.map((stn) => {
            const stnId = stn._id ? stn._id.toString() : (stn.id || stn.stationCode);
            const y = coordinateModel.getStationY(stnId);
            if (y === undefined) return null;

            const isSelected = selectedStationId === stnId;
            const isJunction = stn.isJunction || stn.stationType === 'JUNCTION' || (stn.platforms && stn.platforms.length >= 4);
            const km = coordinateModel.getStationKm(stnId);

            return (
              <g
                key={`stn-axis-${stnId}`}
                transform={`translate(0, ${y})`}
                className="cursor-pointer group"
                onClick={() => onStationSelect && onStationSelect(stn)}
                onMouseEnter={() => onStationHover && onStationHover(stn)}
                onMouseLeave={() => onStationHover && onStationHover(null)}
              >
                {/* Station Line Background Highlight */}
                {isSelected && (
                  <rect 
                    x={0} 
                    y={-14} 
                    width="220" 
                    height="28" 
                    fill="rgba(56, 189, 248, 0.15)" 
                    stroke="#38BDF8" 
                    strokeWidth="1" 
                  />
                )}

                {/* Horizontal Guide from Axis */}
                <line 
                  x1={0} 
                  y1={0} 
                  x2={220} 
                  y2={0} 
                  stroke={isJunction ? '#475569' : '#334155'} 
                  strokeWidth={isJunction ? 1.5 : 1} 
                />

                {/* Junction / Station Symbol */}
                {isJunction ? (
                  // Diamond for Junction
                  <polygon 
                    points="14,-6 20,0 14,6 8,0" 
                    fill={isSelected ? '#38BDF8' : '#F59E0B'} 
                    stroke="#D97706" 
                    strokeWidth="1"
                  />
                ) : (
                  // Circle for normal station
                  <circle 
                    cx="14" 
                    cy="0" 
                    r="3.5" 
                    fill={isSelected ? '#38BDF8' : '#94A3B8'} 
                    stroke="#475569" 
                    strokeWidth="1"
                  />
                )}

                {/* Station Code */}
                <text 
                  x="28" 
                  y="-4" 
                  fill={isSelected ? '#38BDF8' : isJunction ? '#F1F5F9' : '#CBD5E1'} 
                  fontWeight={isJunction ? 'bold' : '600'} 
                  fontSize="11"
                  className="group-hover:fill-cyan-300 transition-colors"
                >
                  {stn.stationCode || stn.code}
                </text>

                {/* Station Name */}
                <text 
                  x="68" 
                  y="-4" 
                  fill="#94A3B8" 
                  fontSize="10" 
                  className="truncate group-hover:fill-slate-200"
                >
                  {(stn.name || stn.stationName || '').slice(0, 15)}
                </text>

                {/* Distance KM / Division Tag */}
                <text 
                  x="210" 
                  y="-4" 
                  textAnchor="end" 
                  fill="#64748B" 
                  fontSize="9"
                >
                  {distanceMode === 'PHYSICAL_DISTANCE' ? `${km.toFixed(1)}k` : `${stn.division || 'SR'}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
