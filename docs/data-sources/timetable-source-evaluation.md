# Timetable Source Evaluation

## Objective
Evaluate candidate sources for Train Master and Timetable initialization.

## Sources
### 1. Official Railway FOIS/NTES APIs
- **Train identity**: YES
- **Schedules**: YES
- **Operating Days**: YES
- **Distance**: YES
- **Update frequency**: Real-time
- **Authority**: `AUTHORITATIVE_PRIMARY`
- **Status**: **ACCESS REQUIRED** (Restricted internal API)

### 2. Government Open Data (data.gov.in)
- **Train identity**: YES
- **Schedules**: YES (often outdated snapshot)
- **Operating Days**: YES
- **Distance**: YES
- **Update frequency**: Annual/Periodic
- **Authority**: `GOVERNMENT_OPEN_DATA`
- **Status**: **AVAILABLE BUT INCOMPLETE** (Snapshot)

### 3. Southern Railway Route Dataset (sr_cleaned_route_stops.csv)
- **Train identity**: NO
- **Schedules**: NO
- **Operating Days**: NO
- **Authority**: `SECONDARY_REFERENCE`
- **Status**: **NOT RECOMMENDED FOR TIMETABLES**

## Strategy
Do not fabricate timetable data. The system must await an approved `AUTHORITATIVE_PRIMARY` or `GOVERNMENT_OPEN_DATA` source before inserting authoritative timetable records.
