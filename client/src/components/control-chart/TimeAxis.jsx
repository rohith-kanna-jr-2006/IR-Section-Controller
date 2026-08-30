import React from 'react';

/**
 * TimeAxis
 * 
 * Renders the top/bottom 24-hour horizontal time grid with major 1-hour ticks,
 * 30-minute/15-minute subdivisions, midnight crossing indicators (+1 day),
 * and service-day boundaries without coordinate resets.
 */
export default function TimeAxis({
  timeWindowStart,
  totalHours = 24,
  pixelsPerHour = 120,
  zoom = 1,
  height = 36,
  isTop = true
}) {
  const hours = Array.from({ length: totalHours + 1 }, (_, i) => i);
  const showHalfHours = zoom >= 0.7;
  const showQuarterHours = zoom >= 1.4;

  const baseDate = new Date(timeWindowStart);

  return (
    <div 
      className={`relative select-none bg-slate-950 border-slate-700/80 text-slate-300 font-mono text-xs ${
        isTop ? 'border-b shadow-sm' : 'border-t'
      }`}
      style={{ height: `${height}px`, width: '100%' }}
    >
      <svg className="w-full h-full overflow-visible">
        {hours.map((hour) => {
          const x = hour * pixelsPerHour;
          const tickDate = new Date(baseDate.getTime() + hour * 3600000);
          const hoursStr = tickDate.getHours().toString().padStart(2, '0');
          const minsStr = tickDate.getMinutes().toString().padStart(2, '0');
          const isMidnight = hoursStr === '00' && hour > 0;
          const dayOffset = Math.floor(hour / 24);

          return (
            <g key={`major-tick-${hour}`} transform={`translate(${x}, 0)`}>
              {/* Major Hour Line */}
              <line 
                x1={0} 
                y1={isTop ? height - 14 : 0} 
                x2={0} 
                y2={isTop ? height : 14} 
                stroke={isMidnight ? '#38BDF8' : hour % 6 === 0 ? '#94A3B8' : '#64748B'} 
                strokeWidth={isMidnight ? 2.5 : hour % 6 === 0 ? 1.5 : 1} 
              />
              
              {/* Time Label */}
              <text 
                x={4} 
                y={isTop ? 18 : height - 8} 
                fill={isMidnight ? '#38BDF8' : hour % 6 === 0 ? '#F1F5F9' : '#CBD5E1'} 
                fontSize="11" 
                fontWeight={isMidnight || hour % 6 === 0 ? 'bold' : '600'}
              >
                {`${hoursStr}:${minsStr}`}
                {dayOffset > 0 && isMidnight && (
                  <tspan fill="#F59E0B" fontWeight="bold" fontSize="10">{` +${dayOffset}`}</tspan>
                )}
                {dayOffset > 0 && !isMidnight && (
                  <tspan fill="#F59E0B" fontSize="9">{` +${dayOffset}`}</tspan>
                )}
              </text>

              {/* 30-minute subdivision */}
              {showHalfHours && hour < totalHours && (
                <g transform={`translate(${pixelsPerHour / 2}, 0)`}>
                  <line 
                    x1={0} 
                    y1={isTop ? height - 8 : 0} 
                    x2={0} 
                    y2={isTop ? height : 8} 
                    stroke="#475569" 
                    strokeWidth={1} 
                  />
                  {zoom >= 1.0 && (
                    <text 
                      x={2} 
                      y={isTop ? 17 : height - 9} 
                      fill="#64748B" 
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {`${hoursStr}:30`}
                    </text>
                  )}
                </g>
              )}

              {/* 15-minute subdivisions at high zoom */}
              {showQuarterHours && hour < totalHours && (
                <>
                  <g transform={`translate(${pixelsPerHour * 0.25}, 0)`}>
                    <line 
                      x1={0} 
                      y1={isTop ? height - 5 : 0} 
                      x2={0} 
                      y2={isTop ? height : 5} 
                      stroke="#334155" 
                      strokeWidth={1} 
                    />
                    <text x={2} y={isTop ? 17 : height - 9} fill="#475569" fontSize="8">
                      {`${hoursStr}:15`}
                    </text>
                  </g>
                  <g transform={`translate(${pixelsPerHour * 0.75}, 0)`}>
                    <line 
                      x1={0} 
                      y1={isTop ? height - 5 : 0} 
                      x2={0} 
                      y2={isTop ? height : 5} 
                      stroke="#334155" 
                      strokeWidth={1} 
                    />
                    <text x={2} y={isTop ? 17 : height - 9} fill="#475569" fontSize="8">
                      {`${hoursStr}:45`}
                    </text>
                  </g>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

