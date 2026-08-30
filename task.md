# Phase 7 — Section Controller Operational Workflow Implementation Tasks

## Phase 7 Task Breakdown

- [ ] **Task 1: Scope & Hierarchy Verification** <!-- id: 1 -->
  - [ ] Validate canonical 6-tuple scope `{ zoneId, divisionId, routeId, sectionId, serviceDate, scenarioId }` propagation across frontend and backend.
  - [ ] Ensure Route/Corridor is derived cleanly from section groupings or a lightweight reference structure without duplicating physical section entities.
- [ ] **Task 2: Scoped Graph-State & Data Provenance** <!-- id: 2 -->
  - [ ] Verify `CorridorGraphProvider` and `/api/v1/operations/scenarios/:id/graph-state` return strictly scoped station sequences, block sections, and train stringlines.
  - [ ] Tag dataset source authority explicitly: `OFFICIAL_PRIMARY`, `SECONDARY_REFERENCE`, `VERIFIED`, `NOT_VERIFIED`.
  - [ ] Handle cross-division boundary corridors (e.g. MAS-JTJ across MAS and SA boundaries) cleanly.
- [ ] **Task 3: Operational Section Controller Master Chart UI** <!-- id: 3 -->
  - [ ] Add Operational Train Board (active, delayed, hold status).
  - [ ] Add Section Occupancy status strip & block segment highlighting.
  - [ ] Add Upcoming Conflict timeline with severity beacons and countdown timers.
  - [ ] Add Multi-Alternative Recommendation Queue with scores, projected KPI deltas, and evidence.
  - [ ] Add Selected Train Inspector & Selected Section Inspector overlay drawers.
  - [ ] Add Scenario KPI Summary (avg delay, max delay, conflict count, throughput).
  - [ ] Maintain accessible Table View sync for all chart entities.
- [ ] **Task 4: Decision Support & Ephemeral What-If Evaluation** <!-- id: 4 -->
  - [ ] Connect What-If simulation engine to project alternative trajectory stringlines without DB mutation.
  - [ ] Clear labeling: `WHAT-IF — SIMULATION ONLY — NOT REAL`.
- [ ] **Task 5: Human Approval & Audited Execution Flow** <!-- id: 5 -->
  - [ ] Enforce Controller Review -> What-If -> Explicit Human Approval -> Simulation-Only Action (`HOLD_TRAIN`, `RELEASE_TRAIN`, `RESOLVE_CONFLICT`).
  - [ ] Ensure `ControllerActionExecutor` creates `ControlEvent` and `AuditLog` records with user ID and session isolation.
  - [ ] Verify zero automated executions without controller authorization.
- [ ] **Task 6: Scenario-Isolated Replay Engine** <!-- id: 6 -->
  - [ ] Connect Replay playback directly to persisted `ControlEvent` records.
  - [ ] Guarantee Replay does not invoke `SimulationEngine` or execute `ControllerActionExecutor`.
- [ ] **Task 7: Test Coverage & Regression Gates** <!-- id: 7 -->
  - [ ] Unit tests for Route hierarchy & scoped station extraction.
  - [ ] Integration tests for What-If immutability, approval workflows, and audit logging.
  - [ ] Full validation: `npm test`, `npm run lint`, `npm run build`.
