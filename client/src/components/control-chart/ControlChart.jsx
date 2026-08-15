/* eslint-disable */
import React, { useMemo, useState } from 'react';
import { ChartCoordinateModel, DISTANCE_MODE } from './ChartCoordinateModel';

export const ControlChart = ({
  topologySnapshot,
  timetableSnapshot,
  trainRuns = [],
  sectionOccupancies = [],
  conflicts = [],
  recommendations = [],
  simulationTime = Date.now(),
  distanceMode = DISTANCE_MODE.SCHEMATIC,
  width = 800,
  height = 600,
  timeWindowHours = 4,
  onContextMenuAction,
  onRecommendationClick,
  whatIfOverlay = null
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  // Rebuild model when snapshots or config change
  const coordinateModel = useMemo(() => {
    return new ChartCoordinateModel({
      topologySnapshot,
      timetableSnapshot,
      config: {
        distanceMode,
        timeWindowStart: simulationTime - (1 * 3600000), // Start 1 hour before current sim time
        timeScale: 60000, // 1 pixel = 1 minute
        distanceScale: 10,
        stationSpacing: 60 // tighter spacing for SVG
      }
    });
  }, [topologySnapshot, timetableSnapshot, distanceMode, simulationTime]);

  const handleMouseDown = (e) => {
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (dragStart) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setDragStart(null);
  };

  const handleContextMenu = (e, targetType, targetData) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: targetType,
      data: targetData
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(prev * zoomFactor, 5)));
  };

  // Render stations
  const stations = topologySnapshot?.stations || [];
  
  // X range
  const totalMinutes = timeWindowHours * 60;
  const pixelsX = totalMinutes; // since 1 min = 1 px

  return (
    <div 
      className="relative overflow-hidden bg-gray-900 border border-gray-700 select-none"
      style={{ width, height, cursor: dragStart ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* HUD Overlay */}
      <div className="absolute top-2 left-2 text-white text-xs bg-black bg-opacity-50 p-2 rounded pointer-events-none z-10">
        <div>Distance Mode: {distanceMode === DISTANCE_MODE.SCHEMATIC ? 'SCHEMATIC' : 'PHYSICAL'}</div>
        <div>Sim Time: {new Date(simulationTime).toLocaleTimeString()}</div>
        <div>Zoom: {zoom.toFixed(2)}x</div>
      </div>

      <svg
        width={width}
        height={height}
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: '0 0'
        }}
      >
        <g className="grid-layer">
          {/* Render horizontal station lines */}
          {stations.map(station => {
            const id = station._id || station.id;
            const y = coordinateModel.getStationY(id);
            if (y === undefined) return null;
            return (
              <g key={id}>
                <line x1={0} y1={y} x2={pixelsX} y2={y} stroke="#374151" strokeWidth="1" />
                <text x={10} y={y - 5} fill="#9CA3AF" fontSize="10">{station.name || station.stationCode}</text>
              </g>
            );
          })}

          {/* Render vertical time lines (every hour) */}
          {Array.from({ length: timeWindowHours + 1 }).map((_, i) => {
            const x = i * 60; // 60 mins per hour
            const t = simulationTime - 3600000 + (i * 3600000); // base + hour
            return (
              <g key={`time-${i}`}>
                <line x1={x} y1={0} x2={x} y2={2000} stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
                <text x={x + 5} y={15} fill="#9CA3AF" fontSize="10">
                  {new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </text>
              </g>
            );
          })}
        </g>

        {/* Current Time Indicator */}
        <line
          x1={coordinateModel.getTimeX(simulationTime)}
          y1={0}
          x2={coordinateModel.getTimeX(simulationTime)}
          y2={2000}
          stroke="#F87171"
          strokeWidth="2"
        />

        {/* Render Train Trajectories */}
        <g className="train-runs-layer">
          {trainRuns.map(run => {
            const traj = coordinateModel.getTrainTrajectory(run);
            if (traj.length < 2) return null;
            
            const points = traj.map(pt => `${pt.x},${pt.y}`).join(' ');
            return (
              <g 
                key={run._id || run.id}
                onContextMenu={(e) => handleContextMenu(e, 'TRAIN', run)}
                className="cursor-pointer"
              >
                <polyline
                  points={points}
                  fill="none"
                  stroke={run.status === 'DELAYED' ? '#FBBF24' : '#60A5FA'}
                  strokeWidth="2"
                />
                {/* Points at stations */}
                {traj.map((pt, i) => (
                  <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#3B82F6" />
                ))}
              </g>
            );
          })}
        </g>
        
        {/* Render Section Occupancy */}
        <g className="occupancy-layer">
          {sectionOccupancies.map(occ => {
            const rect = coordinateModel.getSectionOccupancyRect(occ);
            if (!rect) return null;
            
            const fill = occ.occupancyStatus === 'RESERVED' ? 'rgba(96, 165, 250, 0.3)' // Blue-ish
                       : occ.occupancyStatus === 'OCCUPIED' ? 'rgba(239, 68, 68, 0.4)'  // Red-ish
                       : occ.occupancyStatus === 'BLOCKED' ? 'rgba(245, 158, 11, 0.4)' // Orange
                       : 'rgba(107, 114, 128, 0.3)';

            return (
              <g key={occ._id || occ.id}>
                <rect
                  x={rect.x}
                  y={rect.yTop}
                  width={rect.width}
                  height={rect.height}
                  fill={fill}
                  stroke={occ.occupancyStatus === 'OCCUPIED' ? '#EF4444' : 'none'}
                />
                <text x={rect.x + 2} y={rect.yTop + rect.height/2} fill="#FFF" fontSize="8">
                  {occ.trainRunId?.trainRunId || occ.trainRunId}
                </text>
              </g>
            );
          })}
        </g>
        
        {/* Render Conflicts */}
        <g className="conflicts-layer">
          {conflicts.map(conflict => {
            const coord = coordinateModel.getConflictCoordinates(conflict);
            if (!coord) return null;

            return (
              <g key={conflict._id || conflict.id} transform={`translate(${coord.x}, ${coord.y})`}
                 onContextMenu={(e) => handleContextMenu(e, 'CONFLICT', conflict)}
                 className="cursor-pointer">
                <circle r="8" fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" strokeWidth="2" />
                <path d="M-3,-3 L3,3 M-3,3 L3,-3" stroke="#EF4444" strokeWidth="2" />
                <title>
                  {conflict.type} - {conflict.severity}
                  {conflict.status && ` (${conflict.status})`}
                </title>
              </g>
            );
          })}
        </g>
        
        {/* Render Recommendations */}
        <g className="recommendations-layer">
          {recommendations.map(rec => {
            const x = coordinateModel.getTimeX(rec.targetTime || rec.createdAt);
            if (Number.isNaN(x)) return null;
            
            return (
              <g key={rec._id || rec.id} transform={`translate(${x}, 50)`}
                 onClick={() => onRecommendationClick && onRecommendationClick(rec)}
                 className="cursor-pointer hover:opacity-80">
                <polygon points="0,-10 10,10 -10,10" fill="rgba(16, 185, 129, 0.8)" stroke="#059669" />
                <title>Rec: {rec.type} (Score: {rec.recommendationScore})</title>
              </g>
            );
          })}
        </g>

        {/* What-If Overlay */}
        {whatIfOverlay && whatIfOverlay.trainRun && (
          <g className="what-if-layer pointer-events-none">
            {/* Draw alternative trajectory if provided, or just highlight KPI delta in HTML overlay later */}
            <text x="50" y="30" fill="#34D399" fontSize="14" fontWeight="bold">
              WHAT-IF PREVIEW ACTIVE
            </text>
          </g>
        )}
      </svg>

      {/* HTML Context Menu Overlay */}
      {contextMenu && (
        <div 
          className="absolute bg-gray-800 border border-gray-600 rounded shadow-xl py-1 z-50 text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === 'TRAIN' && (
            <>
              <div className="px-3 py-1 font-bold border-b border-gray-700 text-gray-300">
                Train: {contextMenu.data._id || contextMenu.data.id}
              </div>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                onClick={() => { onContextMenuAction('HOLD_TRAIN', contextMenu.data); closeContextMenu(); }}
              >Hold Train</button>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                onClick={() => { onContextMenuAction('RELEASE_TRAIN', contextMenu.data); closeContextMenu(); }}
              >Release Train</button>
            </>
          )}
          {contextMenu.type === 'CONFLICT' && (
            <>
              <div className="px-3 py-1 font-bold border-b border-gray-700 text-gray-300">
                Conflict: {contextMenu.data._id || contextMenu.data.id}
              </div>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                onClick={() => { onContextMenuAction('ACKNOWLEDGE_CONFLICT', contextMenu.data); closeContextMenu(); }}
              >Acknowledge</button>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                onClick={() => { onContextMenuAction('RESOLVE_CONFLICT', contextMenu.data); closeContextMenu(); }}
              >Mark Resolved</button>
            </>
          )}
          <div className="border-t border-gray-700 mt-1">
            <button 
              className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-400"
              onClick={closeContextMenu}
            >Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};
