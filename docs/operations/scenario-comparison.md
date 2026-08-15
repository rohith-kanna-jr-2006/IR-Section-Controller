# Scenario Comparison

To facilitate decision support, controllers can execute multiple `SimulationScenarios` using identical `TopologySnapshots` and `Timetables`, but with different `ControlEvents` (e.g. prioritizing an Express train over a Freight train).

## KPIs
Scenarios are evaluated based on:
1. **Total cumulative delay** across all `TrainRuns`.
2. **Critical Conflict Count**.
3. **Section Occupation Rates**.