# Timetable Reconciliation

## Priority
`OFFICIAL_PRIMARY` > `OFFICIAL_PUBLICATION` > `GOVERNMENT_OPEN_DATA` > `SECONDARY_REFERENCE`

## Strategy
Train numbers act as the primary identity key. If two sources provide timetables for the same train number, a new `TrainSchedule` version is created. Existing versions are never silently overwritten; they are preserved as historical. 

Any contradictions in arrival/departure times between identical authority levels trigger a `REVIEW_REQUIRED` reconciliation event.
