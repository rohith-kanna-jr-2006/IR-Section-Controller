import React from 'react';

/**
 * TrainLabel
 * 
 * Renders mid-span or heading operational train identifiers along train stringlines.
 */
export default function TrainLabel({
  x,
  y,
  trainNumber,
  trainCategory = 'EXP',
  angle = 0,
  strokeColor = '#38BDF8'
}) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${angle})`} className="pointer-events-none select-none">
      <rect
        x="-24"
        y="-8"
        width="48"
        height="16"
        fill="#0F172A"
        fillOpacity="0.8"
        stroke={strokeColor}
        strokeWidth="0.5"
        rx="3"
      />
      <text
        x="0"
        y="3"
        fill="#F8FAFC"
        fontSize="8.5"
        fontWeight="bold"
        fontFamily="monospace"
        textAnchor="middle"
      >
        {trainNumber}
      </text>
    </g>
  );
}
