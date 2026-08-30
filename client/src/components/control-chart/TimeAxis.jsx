import React from 'react';

/**
 * TimeAxis
 * 
 * Renders the top/bottom 24-hour horizontal time grid with major 1-hour ticks,
 * 30-minute/15-minute subdivisions, and midnight indicators.
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
  const showHalfHours = zoom >= 0.8;
  const showQuarterHours = zoom >= 1.5;

  const baseDate = new Date(timeWindowStart);

  return (
    <div 
      className={`relative select-none bg-slate-900 border-slate-700 text-slate-300 font-mono text-xs ${
        isTop ? 'border-b' : 'border-t'
      }`}
      style={{ height: `${height}px`, width: '100%' }}
    >
      <svg className="w-full h-full overflow-visible">
        {hours.map((hour) => {
          const x = hour * pixelsPerHour;
          const tickDate = new Date(baseDate.getTime() + hour * 3600000);
          const hoursStr = tickDate.getHours().toString().padStart(2, '0');
          const minsStr = tickDate.getMinutes().toString().padStart(2, '0');
          const isMidnight = hoursStr === '00';
          const dayOffset = Math.floor(hour / 24);

          return (
            <g key={`major-tick-${hour}`} transform={`translate(${x}, 0)`}>
              {/* Major Hour Line */}
              <line 
                x1={0} 
                y1={isTop ? height - 12 : 0} 
                x2={0} 
                y2={isTop ? height : 12} 
                stroke={isMidnight ? '#38BDF8' : '#64748B'} 
                strokeWidth={isMidnight ? 2 : 1} 
              />
              
              {/* Time Label */}
              <text 
                x={4} 
                y={isTop ? 18 : height - 8} 
                fill={isMidnight ? '#38BDF8' : '#CBD5E1'} 
                fontSize="11" 
                fontWeight={isMidnight ? 'bold' : 'normal'}
              >
                {`${hoursStr}:${minsStr}`}
                {dayOffset > 0 && <tspan fill="#F59E0B" fontSize="9">{` (+${dayOffset}d)`}</tspan>}
              </text>

              {/* 30-minute subdivision */}
              {showHalfHours && hour < totalHours && (
                <g transform={`translate(${pixelsPerHour / 2}, 0)`}>
                  <line 
                    x1={0} 
                    y1={isTop ? height - 6 : 0} 
                    x2={0} 
                    y2={isTop ? height : 6} 
                    stroke="#475569" 
                    strokeWidth={1} 
                  />
                  {zoom >= 1.2 && (
                    <text 
                      x={2} 
                      y={isTop ? 16 : height - 10} 
                      fill="#64748B" 
                      fontSize="9"
                    >
                      30
                    </text>
                  )}
                </g>
              )}

              {/* 15-minute subdivisions */}
              {showQuarterHours && hour < totalHours && (
                <>
                  <line 
                    x1={pixelsPerHour * 0.25} 
                    y1={isTop ? height - 4 : 0} 
                    x2={pixelsPerHour * 0.25} 
                    y2={isTop ? height : 4} 
                    stroke="#334155" 
                    strokeWidth={1} 
                  />
                  <line 
                    x1={pixelsPerHour * 0.75} 
                    y1={isTop ? height - 4 : 0} 
                    x2={pixelsPerHour * 0.75} 
                    y2={isTop ? height : 4} 
                    stroke="#334155" 
                    strokeWidth={1} 
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
