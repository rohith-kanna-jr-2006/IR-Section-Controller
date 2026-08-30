# IR Section Controller

IR Section Controller is a robust web application for managing Indian Railways section data, master data, timetables, and eventual controller decision support.

## Phase 7A — Real Train Timetable Import Pipeline

The platform includes a real-world timetable ingestion pipeline supporting 4 distinct input formats:
- **TEXT / CSV**: Unstructured multiline timetable tables and comma-separated records.
- **JSON**: Canonical structured timetable payloads with schema enforcement.
- **PDF**: Binary PDF documents with digital text extraction.
- **IMAGE / OCR**: Preprocessed optical character recognition matrix ingestion via Tesseract.js.

### Key Capabilities & Guarantees
- **Station Topology Reconciliation**: Matches incoming codes against official Southern Railway database topology with confidence scoring and conflict detection.
- **Zero Master Mutation Guarantee**: Timetables are published strictly into isolated `SimulationScenario` and `TimetableSnapshot` records, preserving master railway records.
- **Timeline Math**: Strict 24-hour absolute minute timeline calculation with automatic midnight crossing resolution.

See `docs/import/` for in-depth architecture and specification guides:
- `docs/import/PIPELINE_ARCHITECTURE.md`
- `docs/import/CANONICAL_TIMETABLE_SPEC.md`
- `docs/import/ISOLATION_AND_PROVENANCE.md`
- `docs/import/PARSERS_AND_OCR.md`

## Architecture
The project follows a standard MERN-stack pattern separated into `client` and `server` workspaces.
See `docs/architecture/README.md` for more details.

## Setup
Ensure Node.js and Docker are installed.
```bash
npm install
docker compose up -d mongodb redis
```

## Running the Application
```bash
npm run dev
```

## Testing
```bash
npm test
```

