# Phase 7 — Section Controller Operational Workflow Implementation Plan

## 1. Executive Summary & Architecture Baseline
Phase 7 elevates the Indian Railways Master Chart from a visualization canvas into a rigorous, simulation-only **Section Controller Operational Workflow**.

**Guiding Directives**:
- **SIMULATION ONLY**: 0 live signalling integration, 0 live dispatch, 0 FOIS/NTES control integration, 0 production railway control APIs.
- **DATA PROVENANCE**: All railway topology and timetable fixtures are strictly labeled (`OFFICIAL_PRIMARY`, `SECONDARY_REFERENCE`, `VERIFIED`, `NOT_VERIFIED`). No fabricated authoritative railway data.
- **CANONICAL SCOPE**: Unambiguous 6-tuple `{ zoneId, divisionId, routeId, sectionId, serviceDate, scenarioId }`.
- **HUMAN-IN-THE-LOOP**: Zero automatic executions. Every operational change requires human controller review and explicit approval, generating an immutable `ControlEvent` and `AuditLog`.
- **EPHEMERAL WHAT-IF**: Decision exploration evaluates alternative trajectories and KPI projections in memory with 0 DB mutations.

---

## 2. Answers to Critical Audit Questions

1. **Is Route/Corridor already a true domain concept?**
   * *Status*: In the database models, `Section` connects two stations (`fromStationId`, `toStationId`) within a `divisionId`. `Route` exists as a higher-level corridor grouping in `srSectionsData.js` (e.g. `West Line (MAS-JTJ)`, `Main Line (JTJ-ED-CBE)`) and as `routeName` strings on sections.
2. **Can Route be introduced without duplicating Section topology?**
   * *Yes*. A Route is a continuous sequence of block sections. Rather than duplicating physical sections, a Route is modeled as an ordered set of Section references or a derived corridor query (`fromStation` $\to$ `toStation` with junction milestones).
3. **Why is SR topology currently represented through `srSectionsData.js`?**
   * *Reason*: It acts as a curated operational dataset extracted from Southern Railway public working timetables and station directories, mapping station sequences, codes, and distances for 6 divisions (MAS, SA, TPJ, MDU, PGT, TVC).
4. **Which portions of that dataset are `SECONDARY_REFERENCE`?**
   * Station names and codes matching IR Official RBS (Railway Board Station Directory) are `OFFICIAL_PRIMARY`. Inter-station physical kilometer values parsed from public timetables or calculated topologically without engineering survey logs are classified as `SECONDARY_REFERENCE` with `verificationStatus: 'NOT_VERIFIED'`.
5. **Which distances are actually authoritative?**
   * Exact chainage distances matching RBS / Zonal WTT (Working Time Table) documents are authoritative. Unverified schematic section distances are flagged as `SECONDARY_REFERENCE`.
6. **How is selected scope propagated into graph-state?**
   * The client requests `GET /api/operations/scenarios/:id/graph-state?divisionId=...&routeId=...&sectionId=...&serviceDate=...`. `CorridorGraphProvider` scopes the station graph and schedules to that corridor, returning exact matching stations, sections, and train stringlines.
7. **Does the graph-state query only selected stations/sections/trains?**
   * *Yes*. When Salem Main Line is selected, exactly the 42 stations on that route (JTJ to CBE) and the train runs traversing those stations are returned, preventing the 695-station network bloat.
8. **Can a train crossing divisions remain visible correctly?**
   * *Yes*. A train traversing across division boundaries (e.g. 12675 Kovai Express starting in Chennai MAS, crossing Katpadi KPD into Salem SA/ED/CBE) is resolved along its full schedule stops that intersect the active corridor.
9. **How are conflicts scoped to the active scenario?**
   * `Conflict` records have a required `scenarioId` foreign key and unique `conflictId`. They are evaluated by `ConflictEngine` strictly against the active scenario's `TrainRun` instances.
10. **How are controller actions audited?**
    * Every action executed via `ControllerActionExecutor` persists a `ControlEvent` (bound to `sessionId`, `scenarioId`, `trainRunId`, `timestamp`) and triggers `AuditLogger.logAudit(req, action, entityType, entityId, changes)`.

---

## 3. Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                            CANONICAL CONTROLLER SCOPE                             |
|  { zoneId: "SR", divisionId: "SA", routeId: "JTJ-CBE", sectionId: "ALL", ... }    |
+-----------------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
|                        OPERATIONAL SECTION CONTROLLER WORKSPACE                   |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | TOP: Controller Scope Bar (Zone > Div > Route > Sec > Date > Scenario)      |  |
|  +-----------------------------------------------------------------------------+  |
|  | OPERATIONAL TRAIN BOARD  |  SECTION OCCUPANCY STRIP  |  SCENARIO KPI SUMMARY|  |
|  +-----------------------------------------------------------------------------+  |
|  |                                                                             |  |
|  |                           MASTER TIME-DISTANCE CHART                        |  |
|  |   Y-Axis: Stations (Topology / Physical KM, Junctions, Terminals)           |  |
|  |   X-Axis: 24-Hour Continuous Timeline (with Midnight Wrapping +1)           |  |
|  |   Stringlines: Scheduled (Dashed) vs Real-Time (Solid) vs Held (Amber)      |  |
|  |   Conflict Beacons: Crossings, Overtakes, Block Headway Violations          |  |
|  |                                                                             |  |
|  +-----------------------------------------------------------------------------+  |
|  | DRAWERS & INSPECTORS:                                                       |  |
|  |   - Upcoming Conflict Timeline & Severity Matrix                            |  |
|  |   - Multi-Alternative Recommendation Queue & KPI Delta Preview              |  |
|  |   - What-If Ephemeral Trajectory Overlay (Simulation Only)                  |  |
|  |   - Train / Section Detail Inspector                                        |  |
|  +-----------------------------------------------------------------------------+  |
|  | BOTTOM: Simulation Controller & Replay Timeline (Play/Pause, Step, Seek)    |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
+------------------------------------+   +------------------------------------+
|       READ-ONLY GRAPH ENGINE       |   |      CONTROLLER ACTION PIPELINE    |
|   CorridorGraphProvider.js         |   |      ControllerActionExecutor.js   |
|   - Scoped station topology        |   |   1. Human Controller Review       |
|   - Adjacent block sections        |   |   2. Optional Ephemeral What-If    |
|   - Timetable snapshot & runs      |   |   3. Explicit Action Authorization |
|   - Authoritative data tagging     |   |   4. Persist ControlEvent          |
|   - 0 Database Mutations           |   |   5. Write AuditLog (User + Session|
+------------------------------------+   +------------------------------------+
                   |                                       |
                   v                                       v
+------------------------------------+   +------------------------------------+
|    EPHEMERAL WHAT-IF ANALYZER      |   |       SCENARIO REPLAY ENGINE       |
|   WhatIfAnalyzer.js                |   |   ReplayEngine.js                  |
|   - In-memory state clone          |   |   - Read persisted ControlEvents   |
|   - Projected KPI & delay deltas   |   |   - 0 SimulationEngine calls       |
|   - 0 DB writes / 0 Events emitted |   |   - 0 ControllerActionExecutor calls|
+------------------------------------+   +------------------------------------+
```

---

## 4. Data-Flow Diagram

```
[ User Controller Scope ]
        |
        v
[ GET /api/operations/scenarios/:id/graph-state?division=SA&route=JTJ-CBE ]
        |
        v
[ CorridorGraphProvider ] ---> Filters stations to corridor (42 stations)
        |                 ---> Assembles adjacent block sections
        |                 ---> Generates scheduled & active train trajectories
        |                 ---> Evaluates crossings, loop overtakes, and conflicts
        |                 ---> Attaches Source Provenance (OFFICIAL_PRIMARY / SECONDARY_REFERENCE)
        v
[ Master Chart Coordinate Model ] ---> Computes (X, Y) layout:
        |                               Y = Station Topological / Physical KM
        |                               X = Service Day absolute minutes (continuous 0..1440+m)
        v
[ Master Chart SVG Canvas ]
        |
        +---> Controller identifies Conflict (e.g. Crossing at Erode Junction ED)
        |
        +---> Opens Recommendation Queue (Alternative A: Hold Freight vs Alternative B: Reschedule Loop)
        |
        +---> [ WHAT-IF PREVIEW ] ---> WhatIfAnalyzer in-memory projection (Dashed Gold Trajectory)
        |                              Shows: Delay Reduction -14m, Punctuality +4.2%
        |
        +---> [ EXPLICIT APPROVE ] ---> POST /api/operations/actions/execute
                                               |
                                               v
                                       [ ControllerActionExecutor ]
                                       - Executes simulation state change
                                       - Writes ControlEvent
                                       - Writes AuditLog with User & Session ID
                                       - Broadcasts socket 'controller.action'
```

---

## 5. Controller Workflow Diagram

```
+-----------------------------------------------------------------------------+
|                          1. CONTROLLER LOGIN & SCOPE                        |
|  Select Zone: SR -> Division: Salem (SA) -> Route: Main Line -> Scenario    |
+-----------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                     2. ACTIVE TRAFFIC MONITORING (MASTER CHART)             |
|  - Monitor live stringlines against scheduled timetables                    |
|  - Observe section block occupancies and train speed variations             |
|  - Real-time simulated clock progression (1x, 2x, 5x, 10x)                  |
+-----------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                     3. CONFLICT DETECTION & ALERT INSPECTION                |
|  - Visual beacon appears at intersection point on chart                     |
|  - Conflict Inspector opens: Severity (CRITICAL/HIGH), Time-to-conflict,     |
|    Involved trains (e.g., 20607 VB vs BOXN Freight), Section & Station      |
+-----------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                     4. DECISION SUPPORT & MULTI-RECOMMENDATIONS             |
|  - RecommendationEngine provides deterministic ranked options:              |
|    * Option 1: Hold Freight on Loop Line at Tiruppur (Score: 94, Delay: 0m) |
|    * Option 2: Precedence Inversion at Erode Junction (Score: 78, Delay: 8m)|
+-----------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                     5. EPHEMERAL WHAT-IF EVALUATION                         |
|  - Controller toggles "What-If" on Option 1                                 |
|  - Chart overlays projected stringlines in gold dash                        |
|  - Projected KPI Delta displayed (Throughput +8%, Delay -12m)               |
|  - Verified: Zero database mutation, purely in-memory state                 |
+-----------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                     6. HUMAN APPROVAL & AUDITED SIMULATION ACTION           |
|  - Controller clicks [ APPROVE & EXECUTE SIMULATION ACTION ]                |
|  - RBAC verification (CONTROLLER role required)                             |
|  - ControllerActionExecutor executes action: HOLD_TRAIN                     |
|  - Immutable ControlEvent & AuditLog entries recorded                       |
+-----------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                     7. POST-ACTION KPI MONITORING & REPLAY                  |
|  - Live scenario KPI updates with actual recovered delay                    |
|  - ReplayEngine enables stepping through historic controller decisions      |
+-----------------------------------------------------------------------------+
```

---

## 6. Proposed API Changes (Read-Only & Simulation Isolated)

Existing APIs are preserved; the following enhancements complete the operational workflow:

| Endpoint | Method | Purpose | Safety / DB Mutation |
| :--- | :---: | :--- | :--- |
| `/api/operations/scenarios/:id/graph-state` | `GET` | Read-only scoped corridor aggregation | Read-Only (0 DB writes) |
| `/api/intelligence/recommendations/:id/what-if` | `POST` | Ephemeral What-If KPI & trajectory evaluation | Ephemeral (0 DB writes) |
| `/api/operations/actions/execute` | `POST` | Centralized audited controller simulation action | Simulation-Only (writes `ControlEvent`, `AuditLog`) |
| `/api/operations/scenarios/:id/replay/events` | `GET` | Read persisted scenario control events for replay | Read-Only |
| `/api/operations/scenarios/:id/kpis` | `GET` | Calculate scenario throughput, delay, punctuality | Read-Only |

---

## 7. Database Changes & Safety Review

* **Zero Destruction / Zero Unsolicited Migrations**: No tables or collections dropped or restructured.
* **Authoritative Master Data Guarantee**:
  * `Station` writes = 0
  * `Section` writes = 0
  * `Train` writes = 0
  * `TrainSchedule` writes = 0
  * `TrainStop` writes = 0
* **Simulation-Only Collections**:
  * `ControlEvent`: Audit trail of simulated holds, releases, and conflict resolutions.
  * `AuditLog`: Security audit of controller actions with `userId`, `timestamp`, `ipAddress`, and `changes`.
  * `ControllerRecommendation`: Proposed decision-support items with `status`, `confidence`, and `score`.

---

## 8. Test Strategy & Acceptance Gates

### Automated Test Matrix
1. **Scope & Territory Filtering**: Verify `Zone -> Division -> Route -> Section` filtering.
2. **Corridor Graph Extraction**: Verify station sequence and block sections strictly match corridor definitions without loading full 695 stations.
3. **Cross-Division Traversal**: Verify multi-division trains (e.g. MAS-CBE) have complete stringline projections across division frontiers.
4. **What-If Immutability**: Verify What-If runs evaluate projections without modifying `SimulationScenario`, `TrainRun`, or master collections.
5. **Human Approval Workflow**: Verify actions execute only upon human trigger, generating `ControlEvent` and `AuditLog`.
6. **Replay Isolation**: Verify `ReplayEngine` consumes persisted events without triggering `SimulationEngine` or `ControllerActionExecutor`.
7. **RBAC & Security**: Verify read-only access for `VIEWER` and action authorization for `CONTROLLER`.

### Verification Commands
* `npm test` — Run all client and server unit and integration tests.
* `npm run lint` — Lint workspace for 0 syntax and unused errors.
* `npm run build` — Compile client Webpack bundle for production.

---

## 9. Acceptance Gates

- [x] Repository audit completed.
- [x] Critical questions answered in detail.
- [x] Implementation plan, task list, and architecture diagrams documented.
- [x] Zero live railway control API integrations.
- [x] Simulation-only safety verified.

*(Standing by for human approval before applying source code modifications.)*
