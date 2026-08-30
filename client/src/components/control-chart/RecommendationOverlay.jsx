import React from 'react';

/**
 * RecommendationOverlay
 * 
 * Renders non-authoritative controller recommendation markers (◇ emerald diamonds)
 * on the Master Control Chart with confidence score badges and click triggers.
 */
export default function RecommendationOverlay({
  recommendations = [],
  coordinateModel,
  onRecommendationClick
}) {
  return (
    <g className="recommendations-layer select-none">
      {recommendations.map((rec) => {
        const coords = coordinateModel.getRecommendationCoordinates(rec);
        if (!coords) return null;

        const recId = rec._id ? rec._id.toString() : (rec.id || rec.recommendationId);
        const score = rec.recommendationScore || 90;
        const type = rec.type || 'HOLD_AND_PRECEDE';

        return (
          <g
            key={`rec-marker-${recId}`}
            transform={`translate(${coords.x}, ${coords.y})`}
            className="cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              onRecommendationClick && onRecommendationClick(rec);
            }}
          >
            {/* Pulsing Emerald Halo */}
            <circle
              r="14"
              fill="rgba(16, 185, 129, 0.2)"
              stroke="#10B981"
              strokeWidth="1"
              strokeDasharray="2 2"
              className="group-hover:scale-125 transition-transform"
            />

            {/* Emerald Diamond Symbol ◇ */}
            <polygon
              points="0,-8 8,0 0,8 -8,0"
              fill="#064E3B"
              stroke="#34D399"
              strokeWidth="1.8"
            />

            {/* AI / Score Star Badge */}
            <circle cx="0" cy="0" r="2.5" fill="#34D399" />

            {/* Score Label on Hover or Persistent */}
            <g transform="translate(10, -8)" className="opacity-85 group-hover:opacity-100">
              <rect
                x="0"
                y="0"
                width="34"
                height="14"
                fill="#0F172A"
                stroke="#10B981"
                strokeWidth="0.8"
                rx="2"
              />
              <text
                x="17"
                y="10"
                fill="#34D399"
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {`${score}%`}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}
