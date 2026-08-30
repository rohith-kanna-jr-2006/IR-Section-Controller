import React from 'react';

/**
 * SectionLayer
 * 
 * Renders block section boundary bands and real-time block occupancies
 * between consecutive railway stations.
 */
export default function SectionLayer({
  sections = [],
  sectionOccupancies = [],
  coordinateModel,
  chartWidth = 2880,
  selectedSectionId,
  onSectionSelect,
  onSectionHover
}) {
  return (
    <g className="sections-and-occupancy-layer select-none">
      {/* Background Section Boundary Horizontal Bands */}
      {sections.map((sec) => {
        const secId = sec._id ? sec._id.toString() : (sec.id || sec.sectionCode);
        const fromId = sec.fromStationId?._id || sec.fromStationId;
        const toId = sec.toStationId?._id || sec.toStationId;
        const y1 = coordinateModel.getStationY(fromId);
        const y2 = coordinateModel.getStationY(toId);

        if (y1 === undefined || y2 === undefined) return null;

        const yTop = Math.min(y1, y2);
        const height = Math.abs(y1 - y2);
        const isSelected = selectedSectionId === secId;

        return (
          <g
            key={`sec-band-${secId}`}
            className="cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              onSectionSelect && onSectionSelect(sec);
            }}
            onMouseEnter={(e) => onSectionHover && onSectionHover(sec, e)}
            onMouseLeave={() => onSectionHover && onSectionHover(null)}
          >
            {/* Subtle boundary band */}
            <rect
              x="0"
              y={yTop}
              width={chartWidth}
              height={height}
              fill={isSelected ? 'rgba(56, 189, 248, 0.08)' : 'transparent'}
              stroke={isSelected ? '#38BDF8' : 'rgba(51, 65, 85, 0.2)'}
              strokeWidth={isSelected ? 1.5 : 0.5}
              strokeDasharray={isSelected ? 'none' : '4 4'}
              className="group-hover:fill-slate-800/30 transition-colors"
            />
          </g>
        );
      })}

      {/* Dynamic Section Occupancies */}
      {sectionOccupancies.map((occ) => {
        const rect = coordinateModel.getSectionOccupancyRect(occ);
        if (!rect) return null;

        const occStatus = occ.occupancyStatus || 'OCCUPIED';
        const trainId = occ.trainRunId?.trainRunId || occ.trainRunId?.trainNumber || occ.trainRunId || 'TRAIN';

        let fill = 'rgba(239, 68, 68, 0.35)'; // red for OCCUPIED
        let stroke = '#EF4444';

        if (occStatus === 'RESERVED') {
          fill = 'rgba(56, 189, 248, 0.25)';
          stroke = '#38BDF8';
        } else if (occStatus === 'BLOCKED') {
          fill = 'rgba(245, 158, 11, 0.35)';
          stroke = '#F59E0B';
        }

        return (
          <g key={`occ-${occ._id || occ.id || Math.random()}`} className="pointer-events-none">
            <rect
              x={rect.x}
              y={rect.yTop}
              width={rect.width}
              height={rect.height}
              fill={fill}
              stroke={stroke}
              strokeWidth="1"
              rx="2"
            />
            {rect.width > 24 && (
              <text
                x={rect.x + 4}
                y={rect.yTop + rect.height / 2 + 3}
                fill="#FFFFFF"
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {`${occStatus === 'BLOCKED' ? 'BLOCK' : 'OCC'} ${typeof trainId === 'string' ? trainId.slice(-6) : ''}`}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
