# Stations API

Base URL: `/api/v1/stations`

## Endpoints

### 1. List Stations
`GET /`

Retrieves a paginated list of stations.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 25)
- `sort` (string): Sort field, prefix with `-` for descending (default: `-createdAt`)
- `stationCode` (string): Exact match (case-insensitive) for station code.
- `name` (string): Partial regex match for station name.
- `zoneId` (ObjectId): Filter by Zone.
- `divisionId` (ObjectId): Filter by Division.
- `stationType` (string): Filter by type.
- `status` (string): Filter by status (e.g., `ACTIVE`, `HISTORICAL`).

### 2. Get Station by ID
`GET /:id`

Retrieves a single station by its MongoDB ObjectId.

### 3. Create Station
`POST /`

Creates a new station record. Enforces temporal identity limits to prevent overlapping `ACTIVE` stations with the same `stationCode`. Also enforces hierarchy rules.

**Body Parameters:**
- `stationCode` (string): Required. Automatically uppercased and trimmed.
- `name` (string): Required.
- `zoneId` (ObjectId): Required.
- `divisionId` (ObjectId): Required. Must belong to the specified Zone.
- `location` (object): GeoJSON Point.
- `status` (string): Status.

**Requires Role:** `ADMIN`, `ZONE_ADMIN`, `DIVISION_ADMIN`, `DATA_OPERATOR`

### 4. Update Station
`PATCH /:id`

Updates an existing station. Enforces scope, hierarchy, and temporal overlap rules.

**Requires Role:** `ADMIN`, `ZONE_ADMIN`, `DIVISION_ADMIN`, `DATA_OPERATOR`

_Note: `DELETE /:id` is not supported to preserve data integrity and audit trails. Use `status: "HISTORICAL"` instead._
