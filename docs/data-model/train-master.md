# Train Master Model

## Overview
The `Train` entity represents the logical service identity of a train, decoupled from its versioned timetables.

## Schema
- **trainNumber**: String (Canonical identifier)
- **name**: String
- **trainType**: String
- **serviceCategory**: String
- **operator**: String
- **zoneId**: ObjectId (Owning zone)
- **status**: `ACTIVE` | `PROPOSED` | `HISTORICAL`
- **verificationStatus**: `VERIFIED` | `NOT VERIFIED` | `REVIEW_REQUIRED` | `CONFLICT`
- **authorityLevel**: `PRIMARY` | `SECONDARY` | `INFERRED`
