# Data Acquisition & Dataset Combination Strategy

## Overview
Because a single freely-accessible, structured, comprehensive, and legally authoritative database for Indian Railways Station Master, Topology, and Timetables does not exist, the architecture relies on a **Multi-Source Reconciliation Foundation**.

## Dataset Combination Strategy

The system synthesizes the final canonical representation by layering sources according to their `authorityLevel`:

1.  **Station Source Layer**
    -   *Preferred*: `AUTHORITATIVE_PRIMARY` (CRIS/NTES API) - *ACCESS REQUIRED*
    -   *Fallback*: `GOVERNMENT_OPEN_DATA` + Official Working Time Table PDFs.
    -   *Role*: Provides canonical `station_code`, `name`, `zoneId`, `divisionId`.
2.  **Topology Source Layer**
    -   *Preferred*: Official working timetables & Engineering line diagrams.
    -   *Secondary*: Datasets like `sr_cleaned_route_stops.csv`.
    -   *Role*: Connects stations to form `Section` records. Used for candidate discovery and anomaly detection.
3.  **Timetable Source Layer**
    -   *Preferred*: Official Indian Railways datasets (NTES API/FOIS).
    -   *Role*: Populates `Train` and `TrainStop` records.
4.  **Historical / Auxiliary Source Layer**
    -   *Preferred*: Open-source community datasets (e.g., Datameet Railways GeoJSON).
    -   *Role*: Enriches coordinates (latitude/longitude), historical names. Classified as `INFERRED` or `SECONDARY_REFERENCE` if cross-validation passes.

**Workflow Diagram:**
```text
Station Source (Code, Name, Zone)
       +
Topology Source (Edges, Distances)
       +
Timetable Source (Trains, Stops)
       +
Historical/Aux Source (GIS Coordinates)
       ↓
Multi-Source Reconciliation Engine
       ↓
Canonical IR Section Controller Data Model
```

## Provenance Enforcement

To maintain data integrity, every candidate source and generated record MUST record provenance:

-   `sourceId`: Reference to the `Source` collection.
-   `authorityLevel`: Must be one of `PRIMARY`, `SECONDARY`, `INFERRED`.
-   `sourceTitle`, `sourceUrl`, `sourceDate`, `retrievedAt`, `documentVersion`, `checksum`, `licenseStatus`.
-   `verificationStatus`: `VERIFIED`, `NOT VERIFIED`, `REVIEW_REQUIRED`, `CONFLICT`.

*Note: Do NOT fabricate publication dates. If unknown, set `sourceDate = null` and add an explanatory note in the `notes` field.*

## Authoritative Publication Rule
Only records satisfying the following criteria may become authoritative Station Master records:
1. Valid station identity
2. Valid zone/division hierarchy
3. Valid provenance
4. No unresolved station-code conflict
5. Approved source authority (`PRIMARY` or human-approved `SECONDARY`)
6. Human approval where required
