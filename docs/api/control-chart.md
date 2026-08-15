# Control Chart APIs

The Control Chart relies on the standard operations APIs. It does NOT introduce direct database mutating routes for scenarios or live operations.

## Fetch Initial State
* `GET /api/scenarios/:scenarioId` - Retrieve Scenario Metadata.
* `GET /api/operations/trains?scenarioId=:id` - Retrieve active `TrainRun` states.
* `GET /api/operations/conflicts?scenarioId=:id` - Retrieve active/resolved Conflicts.
* `GET /api/operations/sections?scenarioId=:id` - Retrieve active Occupancies.

## Graph Interactions (Context Menus)
Authorized roles (e.g. `CONTROLLER`) interact directly with the Chart UI to perform operations:
* **Train Holding**: `POST /api/operations/trains/:id/hold`
* **Train Releasing**: `POST /api/operations/trains/:id/release`
* **Conflict Ack**: `POST /api/operations/conflicts/:id/acknowledge`
* **Conflict Resolve**: `POST /api/operations/conflicts/:id/resolve`
*These endpoints translate REST semantics strictly into `ControllerActionExecutor` events without master data mutation.*

## What-If Overlay
* `POST /api/recommendations/:id/what-if` 
Executes the `WhatIfAnalyzer` for a specific recommendation context. The endpoint duplicates the state ephemerally in RAM and returns projected KPI deltas.

## Real-Time Synchronization (Socket.IO)
Control Chart hooks into the `Socket.IO` namespace for real-time visualization:
* `simulation.clock`
* `train.moved`
* `section.occupancy`
* `conflict.created` & `conflict.updated`
* `recommendation.issued`

Connections explicitly ignore events that don't match the active `scenarioId`. Replay functionality (if integrated) consumes the stored DB `ControlEvent` stack via a `replay.event` emit.
