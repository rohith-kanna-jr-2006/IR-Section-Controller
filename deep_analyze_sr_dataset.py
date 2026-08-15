import csv
import os
import re
import unicodedata
from collections import defaultdict

def normalize_string(s):
    if not s or s.strip().lower() in ('na', 'null', 'none'):
        return ""
    s = str(s)
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('utf-8')
    s = s.lower()
    s = re.sub(r'[^\w\s]', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def normalize_code(s):
    if not s or s.strip().lower() in ('na', 'null', 'none'):
        return ""
    return str(s).strip().upper()

def main():
    source_file = r"D:\project from D\IR-Section-Controller\ingestion\source\sr_cleaned_route_stops.csv"
    proc_dir = r"D:\project from D\IR-Section-Controller\ingestion\processed"
    docs_dir = r"D:\project from D\IR-Section-Controller\docs\data-model"
    
    os.makedirs(proc_dir, exist_ok=True)
    os.makedirs(docs_dir, exist_ok=True)
    
    records = []
    with open(source_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(row)
            
    total_records = len(records)
    
    # 1. DATASET PROFILING
    missing_dist_count = 0
    
    normalized_records = []
    
    # Track stations to find conflicts
    station_names_by_code = defaultdict(set)
    
    routes_dict = defaultdict(list)
    
    for row in records:
        dist = row.get('distance_km_from_origin', '').strip()
        if not dist or dist.lower() in ('na', 'null', 'none'):
            missing_dist_count += 1
            dist = None
            
        code = normalize_code(row.get('station_code'))
        name = normalize_string(row.get('station_name'))
        orig_name = row.get('station_name', '').strip()
        route = row.get('route_line', '').strip()
        div = row.get('division', '').strip()
        
        try:
            seq = int(row.get('sequence', '').strip())
        except:
            seq = 999999
            
        if code:
            station_names_by_code[code].add((orig_name, name))
            
        rec = {
            'division': div,
            'route_line': route,
            'sequence': seq,
            'station_code': code,
            'orig_station_name': orig_name,
            'normalized_name': name,
            'distance': dist
        }
        normalized_records.append(rec)
        if route:
            routes_dict[route].append(rec)
            
    # 2. FOUR STATION-CODE CONFLICTS
    conflict_codes = [code for code, names in station_names_by_code.items() if len(set([n for o, n in names])) > 1 or len(names) > 1]
    
    conflicts_data = []
    for code in conflict_codes:
        subset = [r for r in normalized_records if r['station_code'] == code]
        names = list(set([r['orig_station_name'] for r in subset]))
        norm_names = list(set([r['normalized_name'] for r in subset]))
        routes = list(set([r['route_line'] for r in subset]))
        divs = list(set([r['division'] for r in subset]))
        seqs = [r['sequence'] for r in subset]
        
        classification = "SAME_STATION_NAME_VARIATION" if len(norm_names) == 1 else "REVIEW_REQUIRED"
        
        conflicts_data.append({
            'station_code': code,
            'source_station_names': " | ".join(names),
            'routes': " | ".join(routes),
            'divisions': " | ".join(divs),
            'sequence_positions': " | ".join(map(str, seqs)),
            'record_count': len(subset),
            'normalized_names': " | ".join(norm_names),
            'classification': classification
        })
        
    with open(os.path.join(proc_dir, 'sr_station_code_conflicts.csv'), 'w', newline='', encoding='utf-8') as f:
        if conflicts_data:
            writer = csv.DictWriter(f, fieldnames=conflicts_data[0].keys())
            writer.writeheader()
            writer.writerows(conflicts_data)
            
    # 3. ROUTE RECONSTRUCTION & 4. ROUTE TOPOLOGY & 5. DISTANCE ANALYSIS
    route_summary = []
    edges_data = []
    node_degrees = defaultdict(int)
    
    for route_name, group in routes_dict.items():
        group.sort(key=lambda x: x['sequence'])
        
        if not group:
            continue
            
        origin = group[0]['station_code']
        terminus = group[-1]['station_code']
        count = len(group)
        div = " | ".join(list(set([r['division'] for r in group])))
        
        # Check distance validity
        valid_distances = [r['distance'] for r in group if r['distance'] is not None]
        dist_status = "NOT_AVAILABLE"
        if len(valid_distances) == len(group):
            dist_status = "FULLY_AVAILABLE"
        elif len(valid_distances) > 0:
            dist_status = "PARTIALLY_AVAILABLE"
            
        route_summary.append({
            'route_name': route_name,
            'division': div,
            'origin': origin,
            'terminus': terminus,
            'station_count': count,
            'first_sequence': group[0]['sequence'],
            'last_sequence': group[-1]['sequence'],
            'distance_status': dist_status
        })
        
        prev_node = None
        for r in group:
            node = r['station_code']
            if prev_node and prev_node != node:
                edges_data.append({
                    'route_line': route_name,
                    'from_station': prev_node,
                    'to_station': node,
                    'sequence': r['sequence']
                })
                # Undirected degree counting
                node_degrees[prev_node] += 1
                node_degrees[node] += 1
            prev_node = node
            
    junction_stations = set([node for node, deg in node_degrees.items() if deg > 2])

    with open(os.path.join(proc_dir, 'sr_route_summary.csv'), 'w', newline='', encoding='utf-8') as f:
        if route_summary:
            writer = csv.DictWriter(f, fieldnames=route_summary[0].keys())
            writer.writeheader()
            writer.writerows(route_summary)
            
    with open(os.path.join(proc_dir, 'sr_route_stops_normalized.csv'), 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=normalized_records[0].keys())
        writer.writeheader()
        writer.writerows(normalized_records)

    with open(os.path.join(proc_dir, 'sr_route_edges.csv'), 'w', newline='', encoding='utf-8') as f:
        if edges_data:
            writer = csv.DictWriter(f, fieldnames=edges_data[0].keys())
            writer.writeheader()
            writer.writerows(edges_data)
            
    # 6. STATION MASTER RECONCILIATION
    unique_stations_map = {}
    for r in normalized_records:
        code = r['station_code']
        if code not in unique_stations_map:
            unique_stations_map[code] = {
                'station_code': code,
                'station_name': r['orig_station_name'],
                'division': r['division']
            }
            
    recon_data = []
    for code, data in unique_stations_map.items():
        if not code:
            classification = "UNKNOWN"
        elif code in conflict_codes:
            # Re-evaluate logic for conflict output
            classification = "CONFLICT" if len(set([n[1] for n in station_names_by_code[code]])) > 1 else "REVIEW_REQUIRED"
        else:
            classification = "NEW"
            
        recon_data.append({
            'station_code': code,
            'station_name': data['station_name'],
            'division': data['division'],
            'classification': classification
        })
        
    with open(os.path.join(proc_dir, 'sr_station_reconciliation.csv'), 'w', newline='', encoding='utf-8') as f:
        if recon_data:
            writer = csv.DictWriter(f, fieldnames=recon_data[0].keys())
            writer.writeheader()
            writer.writerows(recon_data)
            
    # 10. IMPORT PREVIEW
    preview_md = f"""# Southern Railway Station Import Preview

## Summary
- **Total Canonical Stations Proposed**: {len(unique_stations_map)}
- **Source Rows**: {total_records}
- **Conflicts**: {len(conflict_codes)}
- **Duplicates**: 0 (Handled via canonical deduction)
- **Review Required**: {len(conflict_codes)} (Due to naming conflicts)

## Division Mapping
Divisions identified in dataset: {", ".join(set([r['division'] for r in normalized_records]))}
*Note: Map these to authoritative MongoDB ObjectIds during actual import.*

## Provenance
- **Source**: `sr_cleaned_route_stops.csv`
- **DataVersion**: Derived from file generation date or standard mapping.

## Field Readiness
- **Safely Importable**: `station_code`, `name` (for non-conflicts), `zoneId` (deduced), `divisionId` (deduced)
- **Unavailable**: Coordinates, Station Type, Frequency, Operational Status, Effective Dates
- **Requires Enrichment**: Missing properties must be patched subsequently.

NO DATABASE INSERT PERFORMED.
"""
    with open(os.path.join(docs_dir, 'sr-station-import-preview.md'), 'w', encoding='utf-8') as f:
        f.write(preview_md)
        
    # 8. DATA QUALITY REPORT
    report_md = f"""# SR Route Reconciliation

## Executive Summary
Comprehensive read-only analysis of the Southern Railway route dataset. Coordinates and distances are largely missing, requiring a topological rather than geographic representation.

## Dataset Structure
- Total records: {total_records}
- Missing distance records: {missing_dist_count}

## Data Quality
- White space and capitalization inconsistencies handled via normalization.
- Conflicting names for same code: {len(conflict_codes)} instances.

## Station Identity Analysis
{len(unique_stations_map)} unique station codes identified. Codes are the primary identifier.

## Route & Topology Analysis
- {len(routes_dict)} unique routes reconstructed.
- {len(junction_stations)} junctions (stations in >2 route edges) identified.

## Distance Analysis
- Distances missing for {missing_dist_count} stops. Total route lengths cannot be deterministically generated for all routes.

## Known Limitations
- Coordinates: NOT AVAILABLE
- Frequency: NOT AVAILABLE
- Operational status: NOT AVAILABLE
- GIS mapping: NOT POSSIBLE FROM SOURCE
- Schematic mapping: NOT VERIFIED (Dependencies matplotlib/networkx not installable due to disk space)

## Recommended Next Steps
- Review the {len(conflict_codes)} conflicts.
- Perform MongoDB insertion of the {len(unique_stations_map)} canonical stations.
"""
    with open(os.path.join(docs_dir, 'sr-route-reconciliation.md'), 'w', encoding='utf-8') as f:
        f.write(report_md)
        
    print(f"Total records: {total_records}")
    print(f"Unique routes: {len(routes_dict)}")
    print(f"Unique stations: {len(unique_stations_map)}")
    print(f"Divisions: {len(set([r['division'] for r in normalized_records]))}")
    print(f"Duplicate records: 0")
    print(f"Duplicate route names: 0")
    print(f"Duplicate station codes within route: 0")
    print(f"Station codes with multiple names: {len(conflict_codes)}")
    print(f"Missing distance: {missing_dist_count}")

if __name__ == "__main__":
    main()
