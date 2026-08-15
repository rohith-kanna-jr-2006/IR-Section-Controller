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
    docs_dir = r"D:\project from D\IR-Section-Controller\docs\data-model"
    os.makedirs(docs_dir, exist_ok=True)
    
    records = []
    with open(source_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(row)
            
    total_records = len(records)
    
    # Pre-processing
    station_names_by_code = defaultdict(set)
    routes_dict = defaultdict(list)
    normalized_records = []
    
    for row in records:
        dist = row.get('distance_km_from_origin', '').strip()
        dist_val = dist if dist and dist.lower() not in ('na', 'null', 'none') else None
        
        code = normalize_code(row.get('station_code'))
        orig_name = row.get('station_name', '').strip()
        norm_name = normalize_string(orig_name)
        route = row.get('route_line', '').strip()
        div = row.get('division', '').strip()
        
        try:
            seq = int(row.get('sequence', '').strip())
        except:
            seq = 999999
            
        if code:
            station_names_by_code[code].add((orig_name, norm_name))
            
        rec = {
            'division': div,
            'route_line': route,
            'sequence': seq,
            'station_code': code,
            'orig_station_name': orig_name,
            'normalized_name': norm_name,
            'distance': dist_val
        }
        normalized_records.append(rec)
        if route:
            routes_dict[route].append(rec)

    # TASK 1: FOUR STATION CODE CONFLICTS
    conflict_codes = [code for code, names in station_names_by_code.items() if len(set([n[0] for n in names])) > 1]
    
    conflicts_output = []
    for code in conflict_codes:
        subset = [r for r in normalized_records if r['station_code'] == code]
        names = list(set([r['orig_station_name'] for r in subset]))
        norm_names = list(set([r['normalized_name'] for r in subset]))
        routes = list(set([r['route_line'] for r in subset]))
        divs = list(set([r['division'] for r in subset]))
        seqs = [r['sequence'] for r in subset]
        
        classification = "SAME_STATION_NAME_VARIATION" if len(norm_names) == 1 else "REVIEW_REQUIRED"
        
        conflicts_output.append({
            'station_code': code,
            'station_names': " | ".join(names),
            'routes': " | ".join(routes),
            'divisions': " | ".join(divs),
            'occurrence_count': len(subset),
            'sequence_positions': " | ".join(map(str, seqs)),
            'classification': classification,
            'recommended_action': "Manual review by Data Operator"
        })

    # TASK 2: STATION MASTER IMPORT CANDIDATES
    unique_stations_map = {}
    for r in normalized_records:
        code = r['station_code']
        if not code: continue
        
        if code not in unique_stations_map:
            unique_stations_map[code] = {
                'stationCode': code,
                'officialNameCandidate': r['orig_station_name'],
                'division': set(),
                'zone': 'SR', # Based on dataset context
                'sourceId': 'SR_DATASET',
                'dataVersionId': 'V1',
                'sourceRecordCount': 0,
                'routeCount': set()
            }
            
        unique_stations_map[code]['division'].add(r['division'])
        unique_stations_map[code]['sourceRecordCount'] += 1
        unique_stations_map[code]['routeCount'].add(r['route_line'])

    candidates = []
    ready_count = 0
    review_count = 0
    conflict_count = 0
    
    for code, data in unique_stations_map.items():
        if code in conflict_codes:
            importStatus = "CONFLICT"
            conflictStatus = "TRUE"
            conflict_count += 1
        elif not data['officialNameCandidate']:
            importStatus = "REVIEW_REQUIRED"
            conflictStatus = "FALSE"
            review_count += 1
        else:
            importStatus = "READY"
            conflictStatus = "FALSE"
            ready_count += 1
            
        candidates.append({
            'stationCode': code,
            'officialNameCandidate': data['officialNameCandidate'],
            'division': " | ".join(data['division']),
            'zone': data['zone'],
            'sourceId': data['sourceId'],
            'dataVersionId': data['dataVersionId'],
            'sourceRecordCount': data['sourceRecordCount'],
            'routeCount': len(data['routeCount']),
            'conflictStatus': conflictStatus,
            'importStatus': importStatus
        })

    # TASK 3: DISTANCE QUALITY
    distance_quality = []
    complete_routes = 0
    partial_routes = 0
    unavailable_routes = 0
    
    for route_name, group in routes_dict.items():
        total_stops = len(group)
        dist_avail = sum(1 for r in group if r['distance'] is not None)
        dist_missing = total_stops - dist_avail
        pct = (dist_avail / total_stops) * 100 if total_stops > 0 else 0
        
        if dist_avail == total_stops:
            status = "COMPLETE"
            complete_routes += 1
        elif dist_avail > 0:
            status = "PARTIAL"
            partial_routes += 1
        else:
            status = "UNAVAILABLE"
            unavailable_routes += 1
            
        distance_quality.append({
            'route': route_name,
            'totalStops': total_stops,
            'distanceAvailable': dist_avail,
            'distanceMissing': dist_missing,
            'distanceCompletenessPercentage': f"{pct:.1f}%",
            'distanceStatus': status
        })

    # TASK 4: SECTION CANDIDATE PREVIEW
    section_candidates = []
    seen_edges = set()
    
    for route_name, group in routes_dict.items():
        group.sort(key=lambda x: x['sequence'])
        
        prev = None
        for curr in group:
            if prev and prev['station_code'] != curr['station_code']:
                from_c = prev['station_code']
                to_c = curr['station_code']
                edge = (from_c, to_c)
                rev_edge = (to_c, from_c)
                
                # We could deduplicate but we want to output all to observe repeated/reverse
                section_candidates.append({
                    'fromStationCode': from_c,
                    'toStationCode': to_c,
                    'routeLine': route_name,
                    'division': curr['division'],
                    'sequence': curr['sequence'],
                    'sourceId': 'SR_DATASET',
                    'dataVersionId': 'V1'
                })
                seen_edges.add(edge)
            prev = curr

    # TASK 6: FINAL IMPORT GATE Markdown
    conflicts_md = "\n".join([
        f"- **{c['station_code']}**: Names: {c['station_names']} | Routes: {c['routes']} | Divs: {c['divisions']} | Classification: {c['classification']}"
        for c in conflicts_output
    ])

    report_content = f"""# Southern Railway Station Import Approval

Total source rows: {total_records}
Canonical station candidates: {len(candidates)}
READY: {ready_count}
REVIEW_REQUIRED: {review_count}
CONFLICT: {conflict_count}

Four station-code conflicts:
<details>
{conflicts_md}
</details>

Distance:
COMPLETE routes: {complete_routes}
PARTIAL routes: {partial_routes}
UNAVAILABLE routes: {unavailable_routes}

Section candidates:
{len(section_candidates)}

Database writes:
0
"""
    with open(os.path.join(docs_dir, 'sr-station-import-approval.md'), 'w', encoding='utf-8') as f:
        f.write(report_content)
        
    print(report_content)

if __name__ == "__main__":
    main()
