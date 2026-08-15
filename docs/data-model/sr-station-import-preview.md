# Southern Railway Station Import Preview

## Summary
- **Total Canonical Stations Proposed**: 691
- **Source Rows**: 781
- **Conflicts**: 4
- **Duplicates**: 0 (Handled via canonical deduction)
- **Review Required**: 4 (Due to naming conflicts)

## Division Mapping
Divisions identified in dataset: SALEM, CHENNAI, PALAKKAD, TVC, MDU, TRICHY
*Note: Map these to authoritative MongoDB ObjectIds during actual import.*

## Provenance
- **Source**: `sr_cleaned_route_stops.csv`
- **DataVersion**: Derived from file generation date or standard mapping.

## Field Readiness
- **Safely Importable**: `station_code`, `name` (for non-conflicts), `zoneId` (deduced), `divisionId` (deduced)
- **Unavailable**: Coordinates, Station Type, Frequency, Operational Status, Effective Dates
- **Requires Enrichment**: Missing properties must be patched subsequently.

NO DATABASE INSERT PERFORMED.
