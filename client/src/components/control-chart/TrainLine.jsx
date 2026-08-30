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

  // Color & Style Logic according to authentic Indian Railways standards
  const runStatus = isWhatIf ? 'WHAT_IF' : (trainRun.runStatus || trainRun.status || 'SCHEDULED');
  const delay = trainRun.delayMinutes || 0;
  const trainType = (trainRun.trainType || trainRun.trainId?.trainType || '').toUpperCase();
  const direction = (trainRun.direction || 'DOWN').toUpperCase();
  const dirArrow = direction === 'UP' ? '▲' : '▼';

  let strokeColor = '#38BDF8'; // default cyan
  let strokeDash = 'none';
  let strokeWidth = isSelected ? 3.8 : isHovered ? 2.8 : 1.9;

  // Base classification color
  if (trainType === 'VANDE_BHARAT') {
    strokeColor = '#818CF8'; // Indigo/Purple
  } else if (trainType === 'SHATABDI' || trainType === 'TEJAS' || trainType === 'RAJDHANI') {
    strokeColor = '#F59E0B'; // Amber/Gold
  } else if (trainType === 'SUPERFAST') {
    strokeColor = '#38BDF8'; // Sky Blue
  } else if (trainType === 'EXPRESS' || trainType === 'MAIL') {
    strokeColor = '#60A5FA'; // Medium Blue
  } else if (trainType === 'PASSENGER' || trainType === 'EMU' || trainType === 'MEMU') {
    strokeColor = '#10B981'; // Emerald Green
  } else if (trainType === 'FREIGHT' || trainType === 'GOODS') {
    strokeColor = '#FB923C'; // Orange/Bronze
  }

  if (isWhatIf) {
    strokeColor = '#34D399'; // Emerald for What-If
    strokeDash = '6 4';
    strokeWidth = 2.6;
  } else if (runStatus === 'CANCELLED') {
    strokeColor = '#EF4444';
    strokeDash = '2 4';
    strokeWidth = 1.4;
  } else if (runStatus === 'DELAYED' || delay > 15) {
    strokeColor = delay > 30 ? '#EF4444' : '#F97316'; // Red if >30m, Orange if 15-30m
    strokeWidth = isSelected ? 3.8 : 2.4;
  } else if (runStatus === 'RUNNING') {
    strokeWidth = isSelected ? 3.8 : 2.2;
  } else if (runStatus === 'COMPLETED' || runStatus === 'ARRIVED') {
    strokeColor = '#64748B';
    strokeWidth = 1.4;
  } else if (runStatus === 'SIMULATED') {
    strokeColor = '#60A5FA';
    strokeDash = '4 2';
  } else if (runStatus === 'REPLAY') {
    strokeColor = '#A855F7';
  }

  const trainNumber = trainRun.trainId?.trainNumber || trainRun.trainNumber || trainRun.trainRunId?.split('_')?.[2] || 'TRAIN';
  const firstPt = trajectory[0];
  const midPt = trajectory[Math.floor(trajectory.length / 2)];
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
        strokeWidth="18"
      />

      {/* Halo for Selected / What-If / Hovered state */}
      {(isSelected || isHovered) && (
        <path
          d={pathD}
          fill="none"
          stroke={isWhatIf ? '#34D399' : strokeColor}
          strokeWidth={isSelected ? 8 : 6}
          strokeOpacity={isSelected ? 0.4 : 0.25}
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
      {trajectory.map((pt, idx) => {
        const isHalt = pt.haltMinutes && pt.haltMinutes > 0;
        const isJct = pt.stop?.isJunction;
        return (
          <g key={`stop-node-${idx}`}>
            {/* Halt bar if dwelling */}
            {pt.xDeparture && pt.xArrival && pt.xDeparture !== pt.xArrival && (
              <line
                x1={pt.xArrival}
                y1={pt.y}
                x2={pt.xDeparture}
                y2={pt.y}
                stroke="#F8FAFC"
                strokeWidth={isJct ? '3.5' : '2.5'}
              />
            )}
            <circle
              cx={pt.xDeparture || pt.x}
              cy={pt.y}
              r={isSelected ? 4 : isJct ? 3 : isHalt ? 2.5 : 1.8}
              fill={isSelected ? '#F8FAFC' : isJct ? '#FCD34D' : strokeColor}
              stroke="#0F172A"
              strokeWidth="0.8"
            />
          </g>
        );
      })}

      {/* Operational Train Origin Tag */}
      {showLabels && firstPt && (
        <g transform={`translate(${firstPt.xArrival || firstPt.x}, ${firstPt.y})`}>
          <rect
            x="-2"
            y="-15"
            width={trainNumber.length * 6.5 + 24}
            height="15"
            fill="#090D16"
            fillOpacity="0.92"
            stroke={strokeColor}
            strokeWidth="0.9"
            rx="2"
          />
          <text
            x="3"
            y="-4"
            fill={strokeColor}
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {dirArrow} {trainNumber}
          </text>
        </g>
      )}

      {/* Midpoint Trajectory Tag for Fast Visual Scanning */}
      {showLabels && midPt && (
        <g transform={`translate(${midPt.xArrival || midPt.x}, ${midPt.y})`}>
          <rect
            x="-2"
            y="-7"
            width={trainNumber.length * 6 + 8}
            height="13"
            fill="#090D16"
            fillOpacity="0.88"
            stroke={strokeColor}
            strokeWidth="0.7"
            rx="2"
          />
          <text
            x="2"
            y="3"
            fill="#F1F5F9"
            fontSize="8.5"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {trainNumber}
          </text>
        </g>
      )}

      {/* Operational Train Terminus Tag */}
      {showLabels && lastPt && (
        <g transform={`translate(${lastPt.xDeparture || lastPt.x}, ${lastPt.y})`}>
          <rect
            x="-2"
            y="2"
            width={trainNumber.length * 6.5 + 24}
            height="15"
            fill="#090D16"
            fillOpacity="0.92"
            stroke={strokeColor}
            strokeWidth="0.9"
            rx="2"
          />
          <text
            x="3"
            y="13"
            fill={strokeColor}
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {dirArrow} {trainNumber}
          </text>
        </g>
      )}
    </g>
  );
}
