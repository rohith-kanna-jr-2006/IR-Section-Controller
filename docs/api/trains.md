# Trains API

## GET /api/v1/trains
- **Query**: `status`, `zoneId`, `trainNumber`, `name`, `page`, `limit`
- **Response**: Paginated list of `Train` records

## GET /api/v1/trains/:id
- **Response**: Single `Train` record

## POST /api/v1/trains
- **RBAC**: ADMIN, ZONE_ADMIN, DATA_OPERATOR
- **Body**: Train details including provenance

## PATCH /api/v1/trains/:id
- **RBAC**: ADMIN, ZONE_ADMIN, DATA_OPERATOR
- **Body**: Partial Train details
