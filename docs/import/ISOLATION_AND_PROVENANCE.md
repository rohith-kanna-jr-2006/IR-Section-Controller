# Master Topology Isolation & Data Provenance

## 1. Zero Mutation Guarantee

To ensure operational safety in the railway section controller environment, the timetable ingestion system enforces a **Zero Mutation Guarantee**:

1. **Read-Only Master Topology**: Ingestion operations NEVER execute `INSERT`, `UPDATE`, or `DELETE` operations on authoritative database collections:
   - `Station`
   - `Section`
   - `Train`
   - `TrainSchedule`
   - `TrainStop`

2. **Isolated Target Publishing**: All parsed, validated, and approved timetables are committed strictly to:
   - `SimulationScenario`: An isolated sandbox container for schedule testing and conflicts analysis.
   - `TimetableSnapshot`: A versioned reference dataset tagged with import ID, schedule hash, and provenance metadata.

---

## 2. Provenance and Authority Metadata

Every imported timetable carries explicit provenance tracking:

- **Source Types**:
  - `USER_PROVIDED`: Raw manual text or copy-pasted operational input.
  - `OFFICIAL_PUBLICATION`: TAAG (Trains at a Glance) or WTT (Working Time Table).
  - `GOVERNMENT_OPEN_DATA`: Open government data portal feeds.
  - `SECONDARY_REFERENCE`: Unofficial passenger reference repositories.
  - `OCR_EXTRACTED`: Optical character recognition outputs from document graphics.

- **Verification Status**:
  - `VERIFIED`: Formally authenticated against official source.
  - `NOT_VERIFIED`: Direct manual input awaiting provenance check.
  - `REVIEW_REQUIRED`: Contains low-confidence OCR glyphs, unresolved aliases, or unindexed stations.

- **Authority Level**:
  - `PRIMARY`: Authoritative railway control system feed.
  - `SECONDARY`: Working or simulation timetable reference.
  - `INFORMATIONAL`: Third-party or scanned timetable record.
