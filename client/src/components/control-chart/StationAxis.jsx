import React from 'react';
import { DISTANCE_MODE } from './ChartCoordinateModel';

/**
 * StationAxis
 * 
 * Renders the dedicated operational vertical station & distance rail on the left of the Master Chart.
 * Displays:
 * - Header with Distance Mode (SCHEMATIC vs REFERENCE KM / PHYSICAL)
 * - Columns: CODE, STATION, KM / SEQ
 * - Symbols: ● Normal station, ◆ Junction, ■ Terminal
 * - Division boundaries
 * - Exact row Y coordinate alignment with the chart grid
 * - Prominent station codes and legible full station names
 * - Selected station glow & horizontal guide alignment
 */
export default function StationAxis({
  stations = [],
  coordinateModel,
  distanceMode = DISTANCE_MODE.SCHEMATIC,
  onDistanceModeToggle,
  selectedStationId,
  onStationSelect,
  onStationHover,
  panY = 0,
  zoom = 1,
  chartHeight
}) {
  const isPhysical = distanceMode === DISTANCE_MODE.PHYSICAL || distanceMode === 'PHYSICAL_DISTANCE';
  const totalHeight = chartHeight || (stations.length + 1) * 65;

  return (
    <div className="w-[260px] bg-slate-950/95 border-r border-slate-700/80 select-none flex-shrink-0 flex flex-col font-mono text-xs z-20 shadow-xl h-full overflow-hidden">
      {/* 1. Header & Distance Mode Toggle (Fixed at top) */}
      <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex flex-col space-y-1.5 flex-shrink-0 z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="text-cyan-400 font-extrabold tracking-wider text-[11px]">
              STATION / DISTANCE
            </span>
          </div>
          <span className="bg-slate-800 text-cyan-300 px-1.5 py-0.2 rounded text-[10px] font-bold border border-slate-700">
            {stations.length} STNS
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-400 font-semibold">
            MODE: <span className={isPhysical ? 'text-amber-400 font-bold' : 'text-cyan-300 font-bold'}>
              {isPhysical ? 'REFERENCE KM' : 'SCHEMATIC'}
            </span>
          </span>
          {onDistanceModeToggle && (
            <button
              onClick={onDistanceModeToggle}
              title="Toggle Schematic / Reference Distance"
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9px] text-slate-300 border border-slate-700 font-semibold transition-colors"
            >
              {isPhysical ? 'Switch to SEQ' : 'Switch to KM'}
            </button>
          )}
        </div>

        {/* Column Headers */}
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-1 border-t border-slate-800/80 tracking-wider">
          <span className="w-14 pl-1">CODE</span>
          <span className="flex-1 px-1">STATION</span>
          <span className="w-16 text-right pr-2">
            {isPhysical ? 'KM' : 'SEQ'}
          </span>
        </div>
      </div>

      {/* 2. Station List Overlay / SVG aligned with exact Y coordinates (Synchronized with Pan & Zoom) */}
      <div className="relative flex-1 overflow-hidden">
        <div
          style={{
            transform: `translateY(${panY}px) scaleY(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          <svg
            className="w-full overflow-visible"
            style={{ height: `${totalHeight}px` }}
          >
            {stations.map((stn, idx) => {
              const stnId = stn._id ? stn._id.toString() : (stn.id || stn.stationCode);
              const y = coordinateModel ? coordinateModel.getStationY(stnId) : idx * 65;
              if (y === undefined) return null;

              const isSelected = selectedStationId === stnId || selectedStationId === stn.stationCode || selectedStationId === stn.code;
              const isJunction = stn.isJunction || stn.stationType === 'JUNCTION' || (stn.platforms && stn.platforms.length >= 4);
              const isTerminal = stn.isTerminal || stn.stationType === 'TERMINAL' || idx === 0 || idx === stations.length - 1;
              const km = coordinateModel ? coordinateModel.getStationKm(stnId) : 0;
              const prevStn = idx > 0 ? stations[idx - 1] : null;
              const isDivisionBoundary = prevStn && stn.division && prevStn.division && stn.division !== prevStn.division;

              const stnCode = (stn.stationCode || stn.code || stnId).toUpperCase();
              const rawName = stn.name || stn.stationName || stnCode;
              const displayName = rawName.length > 16 ? `${rawName.slice(0, 15)}…` : rawName;

              return (
                <g
                  key={`stn-axis-${stnId}`}
                  transform={`translate(0, ${y})`}
                  className="cursor-pointer group"
                  onClick={() => onStationSelect && onStationSelect(stn)}
                  onMouseEnter={(e) => onStationHover && onStationHover(stn, e)}
                  onMouseLeave={() => onStationHover && onStationHover(null)}
                >
                  {/* Division Boundary Divider Marker */}
                  {isDivisionBoundary && (
                    <g transform="translate(0, -28)">
                      <line x1="0" y1="0" x2="260" y2="0" stroke="#EAB308" strokeWidth="1" strokeDasharray="4 2" />
                      <text x="130" y="-3" fill="#EAB308" fontSize="8" fontWeight="bold" textAnchor="middle">
                        │ DIVISION BOUNDARY: {prevStn.division} ➔ {stn.division} │
                      </text>
                    </g>
                  )}

                  {/* Station Line Background Highlight */}
                  {isSelected ? (
                    <rect 
                      x={0} 
                      y={-15} 
                      width="260" 
                      height="30" 
                      fill="rgba(6, 182, 212, 0.18)" 
                      stroke="#22D3EE" 
                      strokeWidth="1.5"
                      className="animate-pulse"
                    />
                  ) : (
                    <rect
                      x={0}
                      y={-15}
                      width="260"
                      height="30"
                      fill="transparent"
                      className="group-hover:fill-slate-900/60 transition-colors"
                    />
                  )}

                  {/* Horizontal Guide from Axis */}
                  <line 
                    x1={0} 
                    y1={0} 
                    x2={260} 
                    y2={0} 
                    stroke={isSelected ? '#22D3EE' : isJunction ? '#475569' : '#334155'} 
                    strokeWidth={isSelected ? 1.5 : isJunction ? 1.2 : 0.8} 
                    strokeDasharray={isSelected ? 'none' : isJunction ? 'none' : '3 3'}
                  />

                  {/* Station Symbol */}
                  <g transform="translate(12, 0)">
                    {isTerminal ? (
                      // Square for Terminal (■)
                      <rect
                        x="-4.5"
                        y="-4.5"
                        width="9"
                        height="9"
                        fill={isSelected ? '#38BDF8' : '#F43F5E'}
                        stroke={isSelected ? '#FFFFFF' : '#9F1239'}
                        strokeWidth="1"
                      />
                    ) : isJunction ? (
                      // Diamond for Junction (◆)
                      <polygon 
                        points="0,-5.5 5.5,0 0,5.5 -5.5,0" 
                        fill={isSelected ? '#38BDF8' : '#F59E0B'} 
                        stroke={isSelected ? '#FFFFFF' : '#D97706'} 
                        strokeWidth="1"
                      />
                    ) : (
                      // Circle for normal station (●)
                      <circle 
                        cx="0" 
                        cy="0" 
                        r="3.5" 
                        fill={isSelected ? '#38BDF8' : '#94A3B8'} 
                        stroke={isSelected ? '#FFFFFF' : '#475569'} 
                        strokeWidth="1"
                      />
                    )}
                  </g>

                  {/* Station Code (Prominent Weight) */}
                  <text 
                    x="24" 
                    y="-3" 
                    fill={isSelected ? '#38BDF8' : isTerminal ? '#FDA4AF' : isJunction ? '#FDE047' : '#F1F5F9'} 
                    fontWeight="bold" 
                    fontSize="11"
                    className="group-hover:fill-cyan-300 transition-colors font-mono"
                  >
                    {stnCode}
                  </text>

                  {/* Station Name (Readable Full Text) */}
                  <text 
                    x="72" 
                    y="-3" 
                    fill={isSelected ? '#F8FAFC' : '#CBD5E1'} 
                    fontSize="10" 
                    className="group-hover:fill-white font-sans"
                  >
                    {displayName}
                  </text>

                  {/* Distance / Sequence Column */}
                  <text 
                    x="252" 
                    y="-3" 
                    textAnchor="end" 
                    fill={isSelected ? '#38BDF8' : '#94A3B8'} 
                    fontSize="9.5"
                    fontWeight="bold"
                    className="font-mono"
                  >
                    {isPhysical 
                      ? `${km.toFixed(1)} km` 
                      : `SEQ ${String(idx + 1).padStart(2, '0')}`
                    }
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
