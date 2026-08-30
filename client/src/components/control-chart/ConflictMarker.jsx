import React from 'react';

/**
 * ConflictMarker
 * 
 * Renders conflict markers at backend-calculated (time, topology) coordinates.
 * Supports Crossing, Overtaking, Following, Section, and Station conflicts
 * with distinct geometric shapes and severity beacons.
 */
export default function ConflictMarker({
  conflicts = [],
  coordinateModel,
  selectedConflictId,
  onConflictClick,
  onContextMenu
}) {
  return (
    <g className="conflicts-layer select-none">
      {conflicts.map((conflict) => {
        const coords = coordinateModel.getConflictCoordinates(conflict);
        if (!coords) return null;

        const conflictId = conflict._id ? conflict._id.toString() : (conflict.id || conflict.conflictId);
        const isSelected = selectedConflictId === conflictId;
        const type = conflict.type || 'CROSSING_PRECEDENCE_CONFLICT';
        const severity = conflict.severity || 'HIGH';

        const isCrossing = type.includes('CROSS') || type === 'CROSSING';
        const isOvertake = type.includes('OVERTAKE') || type === 'OVERTAKING';
        const isFollowing = type.includes('HEADWAY') || type.includes('FOLLOWING');

        let mainColor = '#EF4444'; // Red
        let bgGlow = 'rgba(239, 68, 68, 0.3)';

        if (severity === 'CRITICAL') {
          mainColor = '#DC2626';
          bgGlow = 'rgba(220, 38, 38, 0.4)';
        } else if (severity === 'MEDIUM' || isOvertake) {
          mainColor = '#F59E0B'; // Amber
          bgGlow = 'rgba(245, 158, 11, 0.3)';
        } else if (severity === 'LOW' || isFollowing) {
          mainColor = '#EAB308'; // Yellow
          bgGlow = 'rgba(234, 179, 8, 0.3)';
        }

        return (
          <g
            key={`conflict-marker-${conflictId}`}
            transform={`translate(${coords.x}, ${coords.y})`}
            className="cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              onConflictClick && onConflictClick(conflict);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onContextMenu && onContextMenu(e, 'CONFLICT', conflict);
            }}
          >
            {/* Halo ring for selected or hovering */}
            <circle
              r={isSelected ? 16 : 12}
              fill={bgGlow}
              stroke={mainColor}
              strokeWidth={isSelected ? 1.5 : 0.8}
              strokeDasharray={isSelected ? '3 3' : 'none'}
              className="group-hover:scale-125 transition-transform"
            />

            {/* Shape depending on Conflict Type */}
            {isCrossing ? (
              // Crossing symbol: Red diamond with an X
              <g>
                <polygon
                  points="0,-8 8,0 0,8 -8,0"
                  fill="#7F1D1D"
                  stroke={mainColor}
                  strokeWidth="1.5"
                />
                <line x1="-3" y1="-3" x2="3" y2="3" stroke="#F8FAFC" strokeWidth="1.5" />
                <line x1="-3" y1="3" x2="3" y2="-3" stroke="#F8FAFC" strokeWidth="1.5" />
              </g>
            ) : isOvertake ? (
              // Overtake symbol: Double orange chevron / arrows
              <g>
                <polygon
                  points="-6,6 0,-6 6,6"
                  fill="#78350F"
                  stroke={mainColor}
                  strokeWidth="1.5"
                />
                <line x1="-4" y1="1" x2="0" y2="-4" stroke="#F8FAFC" strokeWidth="1.2" />
                <line x1="0" y1="-4" x2="4" y2="1" stroke="#F8FAFC" strokeWidth="1.2" />
              </g>
            ) : (
              // Following / Station warning triangle
              <g>
                <polygon
                  points="0,-7 7,6 -7,6"
                  fill="#713F12"
                  stroke={mainColor}
                  strokeWidth="1.5"
                />
                <circle cx="0" cy="3" r="1" fill="#F8FAFC" />
                <line x1="0" y1="-3" x2="0" y2="1" stroke="#F8FAFC" strokeWidth="1.2" />
              </g>
            )}

            {/* Severity Mini Badge */}
            <text
              x="12"
              y="3"
              fill={mainColor}
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900"
            >
              {isCrossing ? 'CROSS' : isOvertake ? 'OVERTAKE' : 'CONFLICT'}
            </text>
          </g>
        );
      })}
    </g>
  );
}
