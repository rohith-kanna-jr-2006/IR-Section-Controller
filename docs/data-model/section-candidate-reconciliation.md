# Section Candidate Reconciliation

## Overview
This document serves as the reconciliation output for Section Candidates generated from the SR Route-Topology secondary dataset.

- **Authoritative Writes**: 0
- **Primary Source**: ACCESS REQUIRED
- **Secondary Source**: VERIFIED (`sr_cleaned_route_stops.csv`)

## Methodology
- Edges are created sequentially between stops within each route.
- Reversing edges and overlapping edges are preserved as route memberships over physical sections.
- Missing distances are explicitly flagged as `NOT_AVAILABLE`.
- No coordinates or physical infrastructure elements (tracks, traction, blocks) are inferred.

## Next Steps
- Import primary section authority to validate these candidates.
