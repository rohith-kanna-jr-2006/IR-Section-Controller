# Interactive Control Chart

## Overview
The Interactive Control Chart is the primary visual interface for monitoring and interacting with a `SimulationScenario`. It operates strictly as a **Read-Only visualization layer** overlaid with ephemeral interaction mechanics. It relies exclusively on the outputs of the `SimulationEngine`, `ConflictEngine`, and `RecommendationEngine`.

## Architecture
The chart renders a time-distance graph in SVG using the following flow:
1. **Coordinate Mapping**: Topology and Timetable snapshots are flattened into a consistent `(x, y)` plane by `ChartCoordinateModel`.
2. **Data Binding**: Real-time `TrainRun` trajectories and `SectionOccupancy` data are bound to these coordinates.
3. **Socket Subscription**: The `useSimulationSocket` hook intercepts Socket.IO events (e.g. `train.moved`, `section.occupancy`, `conflict.created`) scoped by `scenarioId` and updates local component state.
4. **Interaction Overlays**: Features like the Context Menu (`HOLD_TRAIN`) or Recommendations overlay provide input vectors that are posted back to the server (e.g., via `POST /recommendations/:id/what-if`).

## Constraints
* **Simulation Only**: The chart does not interact with the master registry (no live `Train`, `Station`, or `Section` modifications).
* **RBAC Enforcement**: Graph actions (e.g., Hold/Release) hit endpoints fortified by `rbac(ROLES.CONTROLLER)`.
* **State Protection**: When websocket connection degrades or lags real-time simulation bounds (>5s), the UI throws a `STALE/DISCONNECTED` modal intercepting all input.
