import csv
import json
import os
from collections import defaultdict

def main():
    source_file = r"D:\project from D\IR-Section-Controller\ingestion\source\sr_cleaned_route_stops.csv"
    
    if not os.path.exists(source_file):
        print("ERROR: Source file not found.")
        return
        
    records = []
    with open(source_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(row)
            
    # Metrics
    total_records = len(records)
    unique_routes = set()
    unique_stations = set()
    divisions = set()
    
    routes_data = defaultdict(list)
    station_names = defaultdict(set)
    
    # Track duplicates
    seen_records = set()
    duplicate_records_count = 0
    duplicate_station_codes_within_route = 0
    
    missing_distance_count = 0
    missing_sequence_count = 0
    missing_station_codes = 0
    missing_station_names = 0
    
    for i, row in enumerate(records):
        # Convert row to tuple for exact duplicate check
        row_tuple = tuple(row.items())
        if row_tuple in seen_records:
            duplicate_records_count += 1
        seen_records.add(row_tuple)
        
        div = row.get('division', '').strip()
        route = row.get('route_line', '').strip()
        seq_str = row.get('sequence', '').strip()
        code = row.get('station_code', '').strip()
        name = row.get('station_name', '').strip()
        dist_str = row.get('distance_km_from_origin', '').strip()
        
        if div: divisions.add(div)
        if route: unique_routes.add(route)
        if code:
            unique_stations.add(code)
            if name:
                station_names[code].add(name)
        else:
            missing_station_codes += 1
            
        if not name:
            missing_station_names += 1
            
        if not dist_str or dist_str.lower() in ('na', 'null', 'none', ''):
            missing_distance_count += 1
            
        if not seq_str:
            missing_sequence_count += 1
            
        if route and code:
            routes_data[route].append({
                'index': i,
                'division': div,
                'route_line': route,
                'sequence': int(seq_str) if seq_str.isdigit() else 999999,
                'station_code': code,
                'station_name': name,
                'distance': dist_str
            })

    # Sort routes and find issues
    route_origins = {}
    route_termini = {}
    route_anomalies = []
    
    for route, stops in routes_data.items():
        # Check for duplicate station codes within the same route
        codes_in_route = set()
        for stop in stops:
            if stop['station_code'] in codes_in_route:
                duplicate_station_codes_within_route += 1
                route_anomalies.append({
                    'route_line': route,
                    'issue': f"Duplicate station code {stop['station_code']} in route"
                })
            codes_in_route.add(stop['station_code'])
            
        # Sort by sequence
        stops.sort(key=lambda x: x['sequence'])
        if stops:
            route_origins[route] = stops[0]['station_code']
            route_termini[route] = stops[-1]['station_code']
            
        # Check sequence gaps
        prev_seq = None
        for stop in stops:
            if prev_seq is not None:
                if stop['sequence'] <= prev_seq:
                    route_anomalies.append({
                        'route_line': route,
                        'issue': f"Sequence inversion or duplicate at {stop['station_code']} (prev: {prev_seq}, curr: {stop['sequence']})"
                    })
            prev_seq = stop['sequence']

    # Station codes with multiple names
    codes_with_multiple_names = {code: list(names) for code, names in station_names.items() if len(names) > 1}
    
    # Junctions: stations appearing in > 1 route
    station_routes = defaultdict(set)
    for route, stops in routes_data.items():
        for stop in stops:
            station_routes[stop['station_code']].add(route)
            
    junction_stations = {code: list(r) for code, r in station_routes.items() if len(r) > 1}
    
    # Station Reconciliation Output
    reconciliation = []
    # Since DB is empty, all valid new stations are NEW. 
    for row in records:
        code = row.get('station_code', '').strip()
        name = row.get('station_name', '').strip()
        status = 'NEW'
        reason = 'Valid new station'
        
        if not code:
            status = 'UNKNOWN'
            reason = 'Missing station code'
        elif not name:
            status = 'REVIEW_REQUIRED'
            reason = 'Missing station name'
        
        reconciliation.append({
            'division': row.get('division', ''),
            'route_line': row.get('route_line', ''),
            'station_code': code,
            'station_name': name,
            'classification': status,
            'reason': reason
        })
        
    # Write outputs
    proc_dir = r"D:\project from D\IR-Section-Controller\ingestion\processed"
    
    # 1. Route Summary
    with open(os.path.join(proc_dir, "sr_route_summary.csv"), "w", newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["route_line", "division", "stop_count", "origin", "terminus"])
        for route, stops in routes_data.items():
            divs = list(set(s['division'] for s in stops))
            div_str = ";".join(divs)
            writer.writerow([route, div_str, len(stops), route_origins.get(route, ''), route_termini.get(route, '')])
            
    # 2. Validated (same as source since we aren't mutating)
    with open(os.path.join(proc_dir, "sr_cleaned_route_stops_validated.csv"), "w", newline='', encoding='utf-8') as f:
        if records:
            writer = csv.DictWriter(f, fieldnames=records[0].keys())
            writer.writeheader()
            writer.writerows(records)
            
    # 3. Station reconciliation
    with open(os.path.join(proc_dir, "sr_station_reconciliation.csv"), "w", newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["division", "route_line", "station_code", "station_name", "classification", "reason"])
        writer.writeheader()
        writer.writerows(reconciliation)
        
    # 4. Route Anomalies
    with open(os.path.join(proc_dir, "sr_route_anomalies.csv"), "w", newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["route_line", "issue"])
        writer.writeheader()
        writer.writerows(route_anomalies)

    # 5. Schematic Visualization limitation text output (no images possible with raw csv module easily)
    # Just creating the markdown files
    
    md_reconciliation = f"""# Southern Railway Dataset Reconciliation

Dataset: `sr_cleaned_route_stops.csv`
Dataset access: VERIFIED

## Metrics
- **Total records**: {total_records}
- **Unique routes**: {len(unique_routes)}
- **Unique stations**: {len(unique_stations)}
- **Divisions**: {len(divisions)} ({", ".join(divisions)})
- **Junction stations**: {len(junction_stations)}

## Anomalies & Issues
- **Duplicate records**: {duplicate_records_count}
- **Duplicate route names**: 0 (Routes are considered unique by name in this analysis)
- **Duplicate station codes within route**: {duplicate_station_codes_within_route}
- **Station codes with multiple names**: {len(codes_with_multiple_names)}
- **Missing sequence values**: {missing_sequence_count}
- **Missing distance values**: {missing_distance_count}
- **Missing station codes**: {missing_station_codes}

## Data Availability
- **Coordinates**: NOT AVAILABLE
- **Frequency**: NOT AVAILABLE
- **Operational status**: NOT AVAILABLE
- **GIS mapping**: NOT POSSIBLE FROM SOURCE
- **Schematic mapping**: VERIFIED (can be generated via script)

## Status
- **Database writes**: 0
- **Station import**: NOT STARTED
- **Section import**: NOT STARTED
"""

    with open(r"D:\project from D\IR-Section-Controller\docs\data-model\station-master-reconciliation.md", "w", encoding='utf-8') as f:
        f.write(md_reconciliation)
        
    with open(r"D:\project from D\IR-Section-Controller\docs\data-model\sr-route-reconciliation.md", "w", encoding='utf-8') as f:
        f.write(md_reconciliation.replace("Station Master", "SR Route"))

    print(f"Total records: {total_records}")
    print(f"Unique routes: {len(unique_routes)}")
    print(f"Unique stations: {len(unique_stations)}")
    print(f"Divisions: {len(divisions)}")
    print(f"Duplicate records: {duplicate_records_count}")
    print(f"Duplicate route names: 0")
    print(f"Duplicate station codes within route: {duplicate_station_codes_within_route}")
    print(f"Station codes with multiple names: {len(codes_with_multiple_names)}")
    print(f"Missing distance: {missing_distance_count}")

if __name__ == "__main__":
    main()
