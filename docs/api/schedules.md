# Schedules API

## GET /api/v1/schedules
- **Query**: `trainId`, `status`
- **Response**: List of `TrainSchedule` records

## POST /api/v1/schedules
- **RBAC**: ADMIN, ZONE_ADMIN, DATA_OPERATOR
- **Body**: TrainSchedule details
