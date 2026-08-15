# Train Stops API

## GET /api/v1/schedules/:scheduleId/stops
- **Response**: Ordered array of `TrainStop` records for a schedule

## POST /api/v1/schedules/:scheduleId/stops
- **RBAC**: ADMIN, ZONE_ADMIN, DATA_OPERATOR
- **Body**: Array of `TrainStop` objects. Replaces existing stops for the schedule. Runs `TimetableValidator` on insertion.
- **Validation**: Checks progression, absolute minutes, sequence uniqueness, station existence.
