const fs = require('fs');
const path = require('path');

const docsPath = path.resolve(__dirname, 'docs/operations');
const apiPath = path.resolve(__dirname, 'docs/api');

fs.mkdirSync(docsPath, { recursive: true });
fs.mkdirSync(apiPath, { recursive: true });

const files = {
  'operations/scenario-management.md': `# Scenario Management

## Lifecycle
\`DRAFT\` -> \`VALIDATING\` -> \`READY\` -> \`RUNNING\` -> \`PAUSED\` -> \`COMPLETED\`
Failure path: \`VALIDATING\` -> \`FAILED\`

## Reproducibility
Scenarios are built upon immutable references:
- \`TopologySnapshot\`
- \`TrainSchedule\` versions
- \`randomSeed\`
- \`simulationClockTime\`

Modifications to authoritative databases (Stations/Sections) do not affect locked scenarios.`,

  'operations/scenario-validation.md': `# Scenario Validation

Before a \`DRAFT\` transitions to \`READY\`, the validator engine checks:
1. **Topology Continuity**: The snapshot contains no isolated sections that a selected train must traverse.
2. **Timetable Consistency**: Arrival times strictly precede departure times and day offsets are monotonically increasing.
3. **Asset Availability**: All referenced stations and sections exist within the snapshot.
4. **Failure State**: If any check fails, status becomes \`FAILED\` and the user is alerted.`,

  'operations/replay.md': `# Simulation Replay

Replays are executed by reloading a \`TopologySnapshot\` and the stream of \`ControlEvent\`s scoped to the original \`ScenarioId\`.

Since operations are purely deterministic and random number generation is seeded, re-running a scenario with the same \`randomSeed\` without controller interference will produce a 1:1 match of the historical \`TrainRun\` lifecycle.`,

  'operations/scenario-comparison.md': `# Scenario Comparison

To facilitate decision support, controllers can execute multiple \`SimulationScenarios\` using identical \`TopologySnapshots\` and \`Timetables\`, but with different \`ControlEvents\` (e.g. prioritizing an Express train over a Freight train).

## KPIs
Scenarios are evaluated based on:
1. **Total cumulative delay** across all \`TrainRuns\`.
2. **Critical Conflict Count**.
3. **Section Occupation Rates**.`,

  '../api/scenarios.md': `# Scenarios API

## Scenario Builder
\`POST /api/v1/scenarios\`
- Create a new \`DRAFT\` scenario with a \`randomSeed\` and name.

\`POST /api/v1/scenarios/:id/validate\`
- Trigger the validation engine. Transitions from \`DRAFT\` to \`VALIDATING\`.

\`POST /api/v1/scenarios/:id/trains\`
- Add a list of \`TrainRun\` schedules to the scenario.

\`GET /api/v1/scenarios/:id/kpis\`
- Retrieve computed KPIs for a \`COMPLETED\` scenario for comparison.
`
};

for (const [relPath, content] of Object.entries(files)) {
  fs.writeFileSync(path.resolve(__dirname, 'docs', relPath), content);
}

console.log('Phase 4 documentation generated.');
