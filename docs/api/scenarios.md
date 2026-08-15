# Scenarios API

## Scenario Builder
`POST /api/v1/scenarios`
- Create a new `DRAFT` scenario with a `randomSeed` and name.

`POST /api/v1/scenarios/:id/validate`
- Trigger the validation engine. Transitions from `DRAFT` to `VALIDATING`.

`POST /api/v1/scenarios/:id/trains`
- Add a list of `TrainRun` schedules to the scenario.

`GET /api/v1/scenarios/:id/kpis`
- Retrieve computed KPIs for a `COMPLETED` scenario for comparison.
