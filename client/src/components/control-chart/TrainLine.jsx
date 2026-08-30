import React from 'react';

/**
 * TrainLine
 * 
 * Renders an authentic Indian Railways train stringline across the Master Control Chart.
 * Connects station arrival/departure coordinates, highlights halts, distinguishes run status,
 * and handles selection/hovering.
 */
export default function TrainLine({
  trainRun,
  trajectory = [],
  isSelected = false,
  isDimmed = false,
  isHovered = false,
  isWhatIf = false,
  showLabels = true,
  onSelect,
  onHover,
  onContextMenu
}) {
  if (!trajectory || trajectory.length < 2) return null;

  // Build SVG path data with horizontal dwell segments for halts
  let pathD = '';
  trajectory.forEach((pt, i) => {
    if (i === 0) {
      pathD += `M ${pt.xArrival !== undefined ? pt.xArrival : pt.x} ${pt.y}`;
      if (pt.xDeparture !== undefined && pt.xDeparture !== pt.xArrival) {
        pathD += ` L ${pt.xDeparture} ${pt.y}`;
      }
    } else {
      if (pt.xArrival !== undefined) {
        pathD += ` L ${pt.xArrival} ${pt.y}`;
        if (pt.xDeparture !== undefined && pt.xDeparture !== pt.xArrival) {
          pathD += ` L ${pt.xDeparture} ${pt.y}`; // Horizontal dwell segment
        }
      } else {
        pathD += ` L ${pt.x} ${pt.y}`;
      }
    }
  });

  // Color & Style Logic
  const runStatus = isWhatIf ? 'WHAT_IF' : (trainRun.runStatus || trainRun.status || 'SCHEDULED');
  const delay = trainRun.delayMinutes || 0;

  let strokeColor = '#38BDF8'; // default cyan
  let strokeDash = 'none';
  let strokeWidth = isSelected ? 3.5 : isHovered ? 2.5 : 1.8;

  if (isWhatIf) {
    strokeColor = '#10B981'; // Emerald for What-If
    strokeDash = '6 4';
    strokeWidth = 2.5;
  } else if (runStatus === 'CANCELLED') {
    strokeColor = '#EF4444';
    strokeDash = '2 4';
    strokeWidth = 1.2;
  } else if (runStatus === 'DELAYED' || delay > 15) {
    strokeColor = delay > 30 ? '#EF4444' : '#F59E0B'; // Red if >30m, Orange if 15-30m
    strokeWidth = isSelected ? 3.5 : 2.2;
  } else if (runStatus === 'RUNNING') {
    strokeColor = delay > 5 ? '#FBBF24' : '#38BDF8';
    strokeWidth = isSelected ? 3.5 : 2.0;
  } else if (runStatus === 'COMPLETED' || runStatus === 'ARRIVED') {
    strokeColor = '#94A3B8';
    strokeWidth = 1.5;
  } else if (runStatus === 'SIMULATED') {
    strokeColor = '#60A5FA';
    strokeDash = '4 2';
  } else if (runStatus === 'REPLAY') {
    strokeColor = '#A855F7';
  }

  const trainNumber = trainRun.trainId?.trainNumber || trainRun.trainNumber || trainRun.trainRunId?.split('_')?.[2] || 'TRAIN';
  const trainName = trainRun.trainId?.name || trainRun.trainName || '';
  const firstPt = trajectory[0];
  const lastPt = trajectory[trajectory.length - 1];

  return (
    <g
      className={`train-stringline cursor-pointer transition-opacity duration-150 ${
        isDimmed ? 'opacity-20' : 'opacity-100'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect && onSelect(trainRun);
      }}
      onMouseEnter={(e) => onHover && onHover(trainRun, e)}
      onMouseLeave={() => onHover && onHover(null)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu && onContextMenu(e, 'TRAIN', trainRun);
      }}
    >
      {/* Invisible wider hit-box for easier clicking/hovering */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth="16"
      />

      {/* Halo for Selected / What-If state */}
      {isSelected && (
        <path
          d={pathD}
          fill="none"
          stroke={isWhatIf ? '#34D399' : '#38BDF8'}
          strokeWidth="7"
          strokeOpacity="0.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Main Stringline Path */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDash}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Station Stop Nodes */}
      {trajectory.map((pt, idx) => (
        <g key={`stop-node-${idx}`}>
          <circle
            cx={pt.xDeparture || pt.x}
            cy={pt.y}
            r={isSelected ? 3.5 : 2.2}
            fill={isSelected ? '#F8FAFC' : strokeColor}
            stroke="#0F172A"
            strokeWidth="0.8"
          />
          {/* Halt bar if dwelling */}
          {pt.xDeparture && pt.xArrival && pt.xDeparture !== pt.xArrival && (
            <line
              x1={pt.xArrival}
              y1={pt.y}
              x2={pt.xDeparture}
              y2={pt.y}
              stroke="#F8FAFC"
              strokeWidth="2.5"
            />
          )}
        </g>
      ))}

      {/* Operational Train Labels */}
      {showLabels && firstPt && (
        <g transform={`translate(${firstPt.xArrival || firstPt.x}, ${firstPt.y})`}>
          <rect
            x="-2"
            y="-14"
            width={trainNumber.length * 7 + 10}
            height="14"
            fill="#0F172A"
            fillOpacity="0.85"
            stroke={strokeColor}
            strokeWidth="0.8"
            rx="2"
          />
          <text
            x="3"
            y="-3"
            fill="#F8FAFC"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {trainNumber}
          </text>
        </g>
      )}

      {showLabels && lastPt && (
        <g transform={`translate(${lastPt.xDeparture || lastPt.x}, ${lastPt.y})`}>
          <rect
            x="-2"
            y="2"
            width={trainNumber.length * 7 + 10}
            height="14"
            fill="#0F172A"
            fillOpacity="0.85"
            stroke={strokeColor}
            strokeWidth="0.8"
            rx="2"
          />
          <text
            x="3"
            y="13"
            fill="#F8FAFC"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {trainNumber}
          </text>
        </g>
      )}
    </g>
  );
}
