# Phase 7A: Train Timetable Import & Reconciliation Pipeline Architecture

## 1. Executive Summary

The Phase 7A Timetable Import System replaces simulated mock ingestion with a full-stack, production-grade ingestion engine capable of parsing, normalizing, station-reconciling, validating, and previewing real train timetable datasets across four core formats:
1. **TEXT / CSV**: Multiline space-delimited and standard RFC-compliant CSV tabular streams.
2. **JSON**: Canonical structured timetable payloads with strict Zod schema validation.
3. **PDF**: Direct digital stream extraction and scanned vector document processing.
4. **IMAGE / OCR**: Preprocessed optical character recognition matrix ingestion via Tesseract.js.

---

## 2. Ingestion Pipeline Stages

The pipeline follows a linear 7-stage processing lifecycle:

```
[ INPUT (Text/JSON/PDF/Image) ]
               │
               ▼
   [ SOURCE IDENTIFICATION ] ─── Auto-detects format, provenance, and authority level
               │
               ▼
           [ PARSE ] ────────── Tokenizes lines, columns, JSON keys, or PDF/OCR glyphs
               │
               ▼
         [ NORMALIZE ] ──────── Resolves midnight crossings, dayOffset, and absolute minutes
               │
               ▼
       [ STATION MATCH ] ────── Reconciles against Southern Railway master topology
               │
               ▼
     [ TIMETABLE VALIDATE ] ─── Validates chronology, minimum halts, and format integrity
               │
               ▼
          [ CLASSIFY ] ──────── Assigns APPROVED, REVIEW_REQUIRED, or FAILED status
               │
               ▼
      [ HUMAN APPROVAL ] ────── Controller review & confirmation in Control Chart UI
               │
               ▼
   [ SIMULATION / SNAPSHOT ] ── Non-authoritative publish into SimulationScenario container
```

---

## 3. Core Engine Components

### 3.1 Parsers (`server/src/services/import/parsers/`)
- `TextTimetableParser.js`: Handles multiline train blocks with departure/arrival times and CSV table structures.
- `JsonTimetableParser.js`: Enforces canonical schema with Zod validation.
- `PdfTimetableParser.js`: Extracts digital text stream from binary PDF buffers up to 10MB/15 pages.
- `ImageOcrTimetableParser.js`: Computes OCR confidence scores and maps confidence classes (`HIGH_CONFIDENCE`, `MEDIUM_CONFIDENCE`, `LOW_CONFIDENCE`).

### 3.2 Station Topology Matcher (`server/src/services/import/StationMatcher.js`)
- Reconciles extracted station codes against the master Southern Railway topology (`srSectionsData.js` and DB stations).
- Detects discrepancies:
  - `MATCHED`: High confidence exact code/name resolution.
  - `REVIEW_REQUIRED`: Fuzzy name match or alias resolution.
  - `CONFLICT`: Station code matched but provided name conflicts with official topology.
  - `NEW_UNKNOWN`: Station code not found in authoritative SR database.

### 3.3 Timetable Validator (`server/src/services/validation/TimetableValidator.js`)
- Enforces absolute timeline math (`dayOffset * 1440 + HH * 60 + mm`).
- Detects chronological regressions, invalid sequence numbers, negative halt durations, and missing terminal times.

### 3.4 Import Pipeline Coordinator (`server/src/services/import/TimetableImportPipeline.js`)
- Orchestrates ingestion jobs with unique import tracking (`IMP_<timestamp>_<rand>`).
- Persists audit logs and non-authoritative snapshot records (`TimetableSnapshot`).

### 3.5 Controller Frontend UI (`client/src/components/control-chart/ImportModal.js`)
- Pure JavaScript React component implemented with `React.createElement`.
- Displays real-time format tabs, upload drag-and-drop zone, parsing progress, and station reconciliation table with confidence badges.
