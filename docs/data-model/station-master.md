# Station Master Data Model

## Overview

The Station Master forms the canonical location identity layer for Indian Railways Section Controller. It defines physical operational locations (stations, halts, yards) and establishes their hierarchical ownership.

## Identity Strategy

Stations are uniquely identified operationally by their `stationCode`. However, organizational changes occur, and stations may shift zones, divisions, or be renamed. To preserve history while ensuring data integrity:
- The system enforces application-level temporal validation on `stationCode`.
- Overlapping `ACTIVE` validity periods (`effectiveFrom`, `effectiveTo`) for the same `stationCode` are rejected.
- Historical records and current records may coexist if their validity periods do not overlap.
- Records are also versioned via `dataVersionId` for lineage and provenance.

## Model Schema

| Field | Type | Description |
|-------|------|-------------|
| `stationCode` | String | Uppercase standard code (e.g., "MAS", "NDLS"). Required. |
| `officialName` | String | The un-normalized authoritative name. |
| `name` | String | A display or search-friendly name. |
| `zoneId` | ObjectId | Reference to the owning Zone. |
| `divisionId` | ObjectId | Reference to the owning Division. |
| `stationType` | String | Type of station (e.g., Halt, Junction, Terminus). |
| `location` | GeoJSON | `{ type: "Point", coordinates: [longitude, latitude] }`. Indexed with `2dsphere`. |
| `status` | Enum | `ACTIVE`, `PROPOSED`, `REORGANIZED`, `HISTORICAL`, `CORPORATION` |
| `effectiveFrom` | Date | When this specific identity became active. |
| `effectiveTo` | Date | When this identity ceased to be active. |
| `sourceId` | ObjectId | Provenance: where did this data come from. |
| `dataVersionId` | ObjectId | Provenance: dataset version lineage. |

## Normalization

- **Station Code**: Always trimmed and uppercased.
- **Station Name**: For search/matching purposes, a normalized variant (lowercase, unicode-normalized, punctuation removed) may be generated, but the `officialName` remains untouched.

## Hierarchy Constraints

Every Station must belong to a Division, and that Division must belong to the specified Zone. Cross-zone division mapping is explicitly rejected.
