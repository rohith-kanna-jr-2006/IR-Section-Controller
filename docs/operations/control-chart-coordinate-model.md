# Chart Coordinate Model

## Purpose
The `ChartCoordinateModel` provides deterministic projections for `TopologySnapshot` and `TimetableSnapshot` entities. It translates domain entities into 2D Cartesian plane coordinates `(X, Y)` appropriate for an SVG canvas in the Control Chart UI.

## Distance Modes
The Y-axis is computed using one of two modes:
1. **SCHEMATIC (`DISTANCE_MODE.SCHEMATIC`)**: All stations are spaced equally according to a configured constant distance (e.g. 50px).
2. **PHYSICAL (`DISTANCE_MODE.PHYSICAL`)**: Stations are spaced relative to actual kilometer distance metadata parsed from sections in the snapshot, scaled by a configured factor.

## Y-Axis: Station Topological Spread
Y-axis calculation follows a deterministic Breadth-First Search (BFS) over the `TopologySnapshot`. Start nodes (`inDegree == 0`) are identified, and the graph is traversed applying distance offsets progressively to compute precise Y coordinates for each station ID.

## X-Axis: Time Constraints
The X-axis represents Time progressing linearly.
`getTimeX(timestamp)` produces horizontal X offsets anchored against a base `timeWindowStart` UTC time. 
For trajectories without precise coordinates, arrival/departure minutes are linearly interpolated from `timeWindowStart`.

## Projection Interfaces
* `getTrainRunPolyline(trainRun)`: Maps the real-time simulation updates into continuous `polyline` elements reflecting path history.
* `getSectionBounds(sectionId)`: Maps section start and end coordinates into bounding rectangles for Occupancy rendering.
* `getConflictPoint(conflict)`: Finds precise spatial midpoints for active conflicts ensuring accurate marker placement on the graph.
