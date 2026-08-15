# Indian Railways Data Source Evaluation

## Evaluation Matrix

| Source | Authority Level | Provider | Access Method | Download Available | License/Usage Status | Update Frequency | Coverage | Station Data | Route Data | Timetable Data | Coordinates | Provenance Quality | Recommended Usage | Risks |
|--------|-----------------|----------|---------------|--------------------|----------------------|------------------|----------|--------------|------------|----------------|-------------|-------------------|-------------------|-------|
| CRIS NTES / FOIS APIs | AUTHORITATIVE_PRIMARY | Centre for Railway Information Systems (CRIS) | Restricted API | No (Bulk) | Restricted / Commercial | Real-time | Pan-India | Yes | Yes | Yes | Yes | High | Primary authoritative source for all data | ACCESS_REQUIRED, closed system |
| Open Government Data Portal (data.gov.in) | GOVERNMENT_OPEN_DATA | Govt. of India | HTTP Download | Yes | OGD License | Sporadic/Yearly | Pan-India | Partial | No | Partial | No | High | Reference for historical/statistical counts | Lacks granular operational/topology data |
| Trains at a Glance / Zonal Working Time Tables | OFFICIAL_PUBLICATION | Indian Railways Zones | PDF Download | Yes (PDF) | Public Reference | Annual | Pan-India | Yes | Yes | Yes | No | High | Authoritative cross-validation | Unstructured PDF format requires manual parsing |
| datameet/railways (GitHub) & Kaggle Datasets | SECONDARY_REFERENCE | Open Source Community | HTTP Download | Yes | CC-BY / Various | Intermittent | Pan-India | Yes | Yes | No | Yes | Low-Medium | GIS mappings, candidate discovery | Non-authoritative, lacks official updates |
| SR Cleaned Route Stops | SECONDARY_REFERENCE | Project Workspace | Local File | Yes | Research / Internal | Unknown | Southern Rly | Partial | Yes | No | No | Medium | Route topology, anomaly detection | Incomplete distances, no coordinates |

## Detailed Analysis

### 1. CRIS NTES (National Train Enquiry System)
**Classification**: AUTHORITATIVE_PRIMARY
- **Overview**: The core operational system of Indian Railways.
- **Constraints**: Requires authorized API access. Do not attempt to bypass access controls.
- **Verdict**: ACCESS_REQUIRED.

### 2. data.gov.in (Government Open Data)
**Classification**: GOVERNMENT_OPEN_DATA
- **Overview**: Provides high-level statistics and some older operational data.
- **Constraints**: A master, up-to-date Station Master or timetable in bulk structured format is not freely provided.
- **Verdict**: Not suitable as a primary operational Station Master.

### 3. Official Publications (Trains at a Glance)
**Classification**: OFFICIAL_PUBLICATION
- **Overview**: Provides authoritative timetables.
- **Constraints**: Unstructured PDF data.
- **Verdict**: Use for cross-validation only unless PDF parsers are built.

### 4. Community Datasets (Datameet / Kaggle)
**Classification**: SECONDARY_REFERENCE
- **Overview**: Useful for inferring GIS coordinates and historical station lists.
- **Constraints**: Not legally authoritative.
- **Verdict**: Use as SECONDARY_REFERENCE to backfill missing coordinates for visualization, but NOT for authoritative publication.

### 5. Current SR Dataset
**Classification**: SECONDARY_REFERENCE
- **Overview**: Contains 781 stops across 45 routes in SR.
- **Verdict**: Preserved as Route-Topology Reference Data.
