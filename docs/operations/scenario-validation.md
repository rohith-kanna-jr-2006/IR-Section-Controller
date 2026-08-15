# Scenario Validation

Before a `DRAFT` transitions to `READY`, the validator engine checks:
1. **Topology Continuity**: The snapshot contains no isolated sections that a selected train must traverse.
2. **Timetable Consistency**: Arrival times strictly precede departure times and day offsets are monotonically increasing.
3. **Asset Availability**: All referenced stations and sections exist within the snapshot.
4. **Failure State**: If any check fails, status becomes `FAILED` and the user is alerted.