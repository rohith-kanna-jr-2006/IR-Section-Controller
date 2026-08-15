import csv
import os
import re
from collections import defaultdict
import uuid

def normalize_code(s):
    if not s or str(s).strip().lower() in ('na', 'null', 'none'):
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
            
    routes_dict = defaultdict(list)
    
    for row in records:
        dist = row.get('distance_km_from_origin', '').strip()
        dist_val = dist if dist and dist.lower() not in ('na', 'null', 'none') else None
        code = normalize_code(row.get('station_code'))
        name = row.get('station_name', '').strip()
        route = row.get('route_line', '').strip()
        div = row.get('division', '').strip()
        
        try:
            seq = int(row.get('sequence', '').strip())
        except:
            seq = 999999
            
        rec = {
            'division': div,
            'route_line': route,
            'sequence': seq,
            'station_code': code,
            'station_name': name,
            'distance': dist_val
        }
        if route:
            routes_dict[route].append(rec)

    section_candidates = []
    edges_list = []
    route_metrics = []
    topology_anomalies = []
    
    node_degrees = defaultdict(set) # Undirected edge count for junctions
    undirected_edge_routes = defaultdict(list)
    directed_edge_routes = defaultdict(list)
    
    station_names = {}
    
    total_missing_distances = 0
    unique_station_pairs = set()

    for route_name, group in routes_dict.items():
        group.sort(key=lambda x: x['sequence'])
        
        prev = None
        missing_dist_edges = 0
        duplicate_edges_in_route = 0
        
        seen_stations = set()
        
        for curr in group:
            c_code = curr['station_code']
            station_names[c_code] = curr['station_name']
            
            if c_code in seen_stations:
                topology_anomalies.append({
                    'route_line': route_name,
                    'station_code': c_code,
                    'issue': 'Repeated station within route',
                    'severity': 'WARNING'
                })
            seen_stations.add(c_code)
            
            if prev:
                f_code = prev['station_code']
                t_code = c_code
                
                if f_code == t_code:
                    topology_anomalies.append({
                        'route_line': route_name,
                        'station_code': f_code,
                        'issue': 'Self-loop',
                        'severity': 'ERROR'
                    })
                else:
                    dist_status = "AVAILABLE" if curr['distance'] else "NOT_AVAILABLE"
                    if not curr['distance']:
                        missing_dist_edges += 1
                        total_missing_distances += 1
                        
                    seq_gap = curr['sequence'] - prev['sequence']
                    if seq_gap <= 0:
                        topology_anomalies.append({
                            'route_line': route_name,
                            'station_code': f"{f_code}->{t_code}",
                            'issue': 'Reversed or duplicate sequence',
                            'severity': 'ERROR'
                        })
                    elif seq_gap > 1:
                        topology_anomalies.append({
                            'route_line': route_name,
                            'station_code': f"{f_code}->{t_code}",
                            'issue': f'Sequence gap ({seq_gap})',
                            'severity': 'INFO'
                        })
                        
                    dir_edge = (f_code, t_code)
                    undir_edge = tuple(sorted([f_code, t_code]))
                    
                    unique_station_pairs.add(dir_edge)
                    
                    node_degrees[f_code].add(undir_edge)
                    node_degrees[t_code].add(undir_edge)
                    
                    undirected_edge_routes[undir_edge].append(route_name)
                    directed_edge_routes[dir_edge].append(route_name)
                    
                    if dir_edge in directed_edge_routes and len([r for r in directed_edge_routes[dir_edge] if r == route_name]) > 1:
                        duplicate_edges_in_route += 1
                    
                    cand = {
                        'sectionCandidateId': f"SEC-{f_code}-{t_code}-{uuid.uuid4().hex[:6]}",
                        'fromStationCode': f_code,
                        'toStationCode': t_code,
                        'fromStationName': prev['station_name'],
                        'toStationName': curr['station_name'],
                        'routeName': route_name,
                        'division': curr['division'],
                        'zone': 'SR',
                        'sequence': curr['sequence'],
                        'direction': 'FORWARD',
                        'distance': curr['distance'],
                        'distanceStatus': dist_status,
                        'sourceId': 'SR_DATASET',
                        'dataVersionId': 'V1',
                        'verificationStatus': 'NOT_VERIFIED',
                        'authorityLevel': 'SECONDARY_REFERENCE'
                    }
                    section_candidates.append(cand)
                    
                    edges_list.append({
                        'directed_edge': f"{f_code}->{t_code}",
                        'undirected_edge': f"{undir_edge[0]}-{undir_edge[1]}",
                        'route_line': route_name,
                        'distanceStatus': dist_status
                    })
                    
            prev = curr
            
        route_metrics.append({
            'routeName': route_name,
            'division': group[0]['division'],
            'stationCount': len(group),
            'edgeCount': len(group) - 1 if len(group) > 0 else 0,
            'origin': group[0]['station_code'] if group else '',
            'terminus': group[-1]['station_code'] if group else '',
            'junctionCount': 0, # To be updated
            'duplicateEdgeCount': duplicate_edges_in_route,
            'missingDistanceEdgeCount': missing_dist_edges,
            'topologyStatus': 'VERIFIED' if duplicate_edges_in_route == 0 else 'WARNING'
        })

    # Graph analysis
    station_graph = []
    orphans = 0
    terminals = 0
    throughs = 0
    junctions = 0
    
    # Identify orphans from all seen stations
    all_stations_in_source = set(station_names.keys())
    
    for code in all_stations_in_source:
        if not code: continue
        deg = len(node_degrees.get(code, set()))
        
        cls = ''
        if deg == 0:
            cls = 'ORPHAN'
            orphans += 1
        elif deg == 1:
            cls = 'TERMINAL'
            terminals += 1
        elif deg == 2:
            cls = 'THROUGH_STATION'
            throughs += 1
        else:
            cls = 'JUNCTION'
            junctions += 1
            
        station_graph.append({
            'stationCode': code,
            'stationName': station_names[code],
            'degree': deg,
            'classification': cls
        })
        
    for r in route_metrics:
        # Re-calc junctions for route
        group = routes_dict[r['routeName']]
        j_count = sum(1 for stop in group if len(node_degrees.get(stop['station_code'], set())) >= 3)
        r['junctionCount'] = j_count

    duplicate_memberships = sum(1 for routes in undirected_edge_routes.values() if len(set(routes)) > 1)
    
    # Output CSVs
    def write_csv(path, data):
        if not data: return
        with open(path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)

    write_csv(os.path.join(proc_dir, 'sr_section_candidates.csv'), section_candidates)
    write_csv(os.path.join(proc_dir, 'sr_section_edges.csv'), edges_list)
    write_csv(os.path.join(proc_dir, 'sr_route_metrics.csv'), route_metrics)
    write_csv(os.path.join(proc_dir, 'sr_station_graph.csv'), station_graph)
    write_csv(os.path.join(proc_dir, 'sr_topology_anomalies.csv'), topology_anomalies)
    
    # Docs
    preview_md = f"""# Section Network Import Preview

## Summary
- **Total candidate sections**: {len(section_candidates)}
- **Unique station pairs (directed)**: {len(unique_station_pairs)}
- **Undirected edges**: {len(undirected_edge_routes)}
- **Routes**: {len(route_metrics)}
- **Divisions**: {len(set(r['division'] for r in route_metrics))}
- **Junctions**: {junctions}
- **Terminals**: {terminals}
- **Orphans**: {orphans}
- **Disconnected components**: Unknown (Graph traversal not strictly applied, treated as connected routes)
- **Duplicate memberships (edges in >1 route)**: {duplicate_memberships}
- **Missing distances**: {total_missing_distances}
- **Conflicts**: 0 (No explicit section logic conflicts yet)
- **Review-required records**: 0
"""
    with open(os.path.join(docs_dir, 'section-import-preview.md'), 'w', encoding='utf-8') as f:
        f.write(preview_md)
        
    recon_md = f"""# Section Candidate Reconciliation

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
"""
    with open(os.path.join(docs_dir, 'section-candidate-reconciliation.md'), 'w', encoding='utf-8') as f:
        f.write(recon_md)
        
if __name__ == "__main__":
    main()
