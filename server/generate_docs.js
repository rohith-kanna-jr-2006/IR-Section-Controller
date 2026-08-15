import fs from 'fs';
import path from 'path';

const docs = {
  'data-sources/timetable-source-evaluation.md': `# Timetable Source Evaluation

## Objective
Evaluate candidate sources for Train Master and Timetable initialization.

## Sources
### 1. Official Railway FOIS/NTES APIs
- **Train identity**: YES
- **Schedules**: YES
- **Operating Days**: YES
- **Distance**: YES
- **Update frequency**: Real-time
- **Authority**: \`AUTHORITATIVE_PRIMARY\`
- **Status**: **ACCESS REQUIRED** (Restricted internal API)

### 2. Government Open Data (data.gov.in)
- **Train identity**: YES
- **Schedules**: YES (often outdated snapshot)
- **Operating Days**: YES
- **Distance**: YES
- **Update frequency**: Annual/Periodic
- **Authority**: \`GOVERNMENT_OPEN_DATA\`
- **Status**: **AVAILABLE BUT INCOMPLETE** (Snapshot)

### 3. Southern Railway Route Dataset (sr_cleaned_route_stops.csv)
- **Train identity**: NO
- **Schedules**: NO
- **Operating Days**: NO
- **Authority**: \`SECONDARY_REFERENCE\`
- **Status**: **NOT RECOMMENDED FOR TIMETABLES**

## Strategy
Do not fabricate timetable data. The system must await an approved \`AUTHORITATIVE_PRIMARY\` or \`GOVERNMENT_OPEN_DATA\` source before inserting authoritative timetable records.
`,

  'data-model/train-master.md': `# Train Master Model

## Overview
The \`Train\` entity represents the logical service identity of a train, decoupled from its versioned timetables.

## Schema
- **trainNumber**: String (Canonical identifier)
- **name**: String
- **trainType**: String
- **serviceCategory**: String
- **operator**: String
- **zoneId**: ObjectId (Owning zone)
- **status**: \`ACTIVE\` | \`PROPOSED\` | \`HISTORICAL\`
- **verificationStatus**: \`VERIFIED\` | \`NOT VERIFIED\` | \`REVIEW_REQUIRED\` | \`CONFLICT\`
- **authorityLevel**: \`PRIMARY\` | \`SECONDARY\` | \`INFERRED\`
`,

  'data-model/timetable-master.md': `# Timetable Master Model

## Overview
Timetables are represented via \`TrainSchedule\` (the versioned header) and \`TrainStop\` (the ordered sequence of calls).

## TrainSchedule Schema
- **trainId**: ObjectId
- **version**: Number
- **frequency**: \`DAILY\` | \`WEEKLY\` | \`BI_WEEKLY\` | \`SPECIAL\` | \`SEASONAL\` | \`EXCEPT_DAYS\` | \`CUSTOM\`
- **operatingDays**: Array of \`MON\`, \`TUE\`, etc.
- **validFrom** / **validTo**: Date
- **exceptions**: Array of Dates
- **verificationStatus**: \`VERIFIED\` | \`NOT VERIFIED\` | \`REVIEW_REQUIRED\` | \`CONFLICT\`

## TrainStop Schema
- **scheduleId**: ObjectId
- **sequence**: Number
- **stationId**: ObjectId
- **arrival** / **departure**: String (HH:mm)
- **absoluteMinutesArrival** / **absoluteMinutesDeparture**: Number (Calculated for Midnight Crossing)
- **dayOffset**: Number
- **haltMinutes**: Number
`,

  'api/trains.md': `# Trains API

## GET /api/v1/trains
- **Query**: \`status\`, \`zoneId\`, \`trainNumber\`, \`name\`, \`page\`, \`limit\`
- **Response**: Paginated list of \`Train\` records

## GET /api/v1/trains/:id
- **Response**: Single \`Train\` record

## POST /api/v1/trains
- **RBAC**: ADMIN, ZONE_ADMIN, DATA_OPERATOR
- **Body**: Train details including provenance

## PATCH /api/v1/trains/:id
- **RBAC**: ADMIN, ZONE_ADMIN, DATA_OPERATOR
- **Body**: Partial Train details
`,

  'api/schedules.md': `# Schedules API

## GET /api/v1/schedules
- **Query**: \`trainId\`, \`status\`
- **Response**: List of \`TrainSchedule\` records

## POST /api/v1/schedules
- **RBAC**: ADMIN, ZONE_ADMIN, DATA_OPERATOR
- **Body**: TrainSchedule details
`,

  'api/train-stops.md': `# Train Stops API

## GET /api/v1/schedules/:scheduleId/stops
- **Response**: Ordered array of \`TrainStop\` records for a schedule

## POST /api/v1/schedules/:scheduleId/stops
- **RBAC**: ADMIN, ZONE_ADMIN, DATA_OPERATOR
- **Body**: Array of \`TrainStop\` objects. Replaces existing stops for the schedule. Runs \`TimetableValidator\` on insertion.
- **Validation**: Checks progression, absolute minutes, sequence uniqueness, station existence.
`,

  'data-model/timetable-reconciliation.md': `# Timetable Reconciliation

## Priority
\`OFFICIAL_PRIMARY\` > \`OFFICIAL_PUBLICATION\` > \`GOVERNMENT_OPEN_DATA\` > \`SECONDARY_REFERENCE\`

## Strategy
Train numbers act as the primary identity key. If two sources provide timetables for the same train number, a new \`TrainSchedule\` version is created. Existing versions are never silently overwritten; they are preserved as historical. 

Any contradictions in arrival/departure times between identical authority levels trigger a \`REVIEW_REQUIRED\` reconciliation event.
`
};

for (const [relPath, content] of Object.entries(docs)) {
  const fullPath = path.resolve(process.cwd(), '../docs', relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}
console.log('Docs generated.');
