# Scenario Management

## Lifecycle
`DRAFT` -> `VALIDATING` -> `READY` -> `RUNNING` -> `PAUSED` -> `COMPLETED`
Failure path: `VALIDATING` -> `FAILED`

## Reproducibility
Scenarios are built upon immutable references:
- `TopologySnapshot`
- `TrainSchedule` versions
- `randomSeed`
- `simulationClockTime`

Modifications to authoritative databases (Stations/Sections) do not affect locked scenarios.