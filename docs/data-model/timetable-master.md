# Timetable Master Model

## Overview
Timetables are represented via `TrainSchedule` (the versioned header) and `TrainStop` (the ordered sequence of calls).

## TrainSchedule Schema
- **trainId**: ObjectId
- **version**: Number
- **frequency**: `DAILY` | `WEEKLY` | `BI_WEEKLY` | `SPECIAL` | `SEASONAL` | `EXCEPT_DAYS` | `CUSTOM`
- **operatingDays**: Array of `MON`, `TUE`, etc.
- **validFrom** / **validTo**: Date
- **exceptions**: Array of Dates
- **verificationStatus**: `VERIFIED` | `NOT VERIFIED` | `REVIEW_REQUIRED` | `CONFLICT`

## TrainStop Schema
- **scheduleId**: ObjectId
- **sequence**: Number
- **stationId**: ObjectId
- **arrival** / **departure**: String (HH:mm)
- **absoluteMinutesArrival** / **absoluteMinutesDeparture**: Number (Calculated for Midnight Crossing)
- **dayOffset**: Number
- **haltMinutes**: Number
