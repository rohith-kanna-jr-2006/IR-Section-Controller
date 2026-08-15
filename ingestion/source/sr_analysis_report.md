# Southern Railway Route-Line Dataset Analysis

## Scope and source
This analysis is based exclusively on the supplied route-definition file. The file is a compiled JavaScript module containing six Southern Railway division route dictionaries: CHENNAI, SALEM, PALAKKAD, TVC, MDU, and TRICHY. For example, the Chennai dictionary explicitly defines lines such as West Line (MAS-JTJ), North Line (MAS-GDR), South Line (MS-VM), MRTS (MSB-VLCY), Kanchipuram Line (AJJ-CGL), and Arakkonam-Renigunta Border. 

The source does **not** contain station latitude/longitude, track geometry, timetable frequencies, train/service identifiers, or operational-status fields. Therefore geographic distance, service frequency, and active/disused status cannot be derived reliably from this file alone.

## Dataset structure
- Source type: compiled JavaScript (`exports.<DIVISION>_SECTIONS`)
- Divisions found: 6
- Route lines found: 45
- Station-stop records: 781
- Explicit cumulative-distance routes: 4
- Explicit distance coverage: 675.0 km across those routes
- Service type: not encoded
- Operational status: not encoded
- Geographic coordinates: absent

### Routes by division
division
CHENNAI      6
MDU          9
PALAKKAD     6
SALEM       10
TRICHY       9
TVC          5

## Route inventory
The complete route inventory is in `sr_route_summary.csv`. Each route is characterized by division, route name, origin/terminus code and name, number of listed stations, and whether cumulative distance is available.

## Known track-length data
Only these four route definitions contain explicit cumulative kilometre values:
- Salem–KSR Bengaluru (via DPJ): 209 km
- Salem–SMVT Bengaluru (via DPJ): 211 km
- Salem–Yesvantpur (via DPJ): 215 km
- Salem–Mettur Dam: 40 km

These values are source-provided cumulative distances, not independently GIS-measured track lengths. The other 41 route lines should be marked `track_length_km = unknown` until a coordinate/track dataset is supplied.

## Service frequency and operational status
No timetable/service-frequency fields occur in the supplied route definitions. No reliable frequency metric can therefore be calculated.

Similarly, labels such as active, disused, heritage, or under construction are not present. The Nilgiri Mountain Railway is identifiable by its route name in the source, but this analysis does not infer a status label without an authoritative operational-status source.

## Connectivity and junctions
Connectivity is represented by repeated station codes across route definitions. These are useful as candidate junction/intersection points, but repeated codes do not by themselves prove track geometry.

High-reuse station codes include:
station_code  occurrences            station_names
          SA            7           Salem Junction
         TEN            4     Tirunelveli Junction
         SRR            4        Shoranur Junction
         PGT            4        Palakkad Junction
         OML            4          Omalur Junction
         PCV            4  Pachakuppam | Palakkodu
         TPJ            4 Tiruchirappalli Junction
          VM            4      Villupuram Junction
         TVR            3      Thiruvarur Junction
         MNM            3     Manamadurai Junction
         RYC            3               Rayakottai
         MDU            3         Madurai Junction
         SCT            3                Sengottai
         TOP            3                   Toppur
         TGN            3            Tholasampatti
        HSRA            3                    Hosur
         AJJ            3       Arakkonam Junction
         AQL            3              Anekal Road
        BYPL            3          Baiyappanahalli
         CBE            3      Coimbatore Junction
         HLE            3                Heelalige
         DPJ            3              Dharmappuri
        CRLM            3               Carmelaram
         VPT            3    Virudhunagar Junction
         KRR            2           Karur Junction

A full station-code reuse table is embedded in the cleaned stop dataset and can be used to construct a route graph.

## Data-quality findings
- Duplicate route names across divisions: 0.
- Duplicate station codes within the same route: 0.
- Station codes having multiple names: 4.
- Missing cumulative-distance values: 41 of 45 routes.
- Missing coordinates: all station records.
- Missing service frequency: all route records.
- Missing operational status: all route records.

### Important limitations
1. This is a route-definition/topology dataset, not a GIS line-geometry dataset.
2. Station names and codes have not been silently corrected against an external master list.
3. Geographic line length cannot be reconstructed without coordinates or official track geometry.
4. The source mixes operational railway routes with labels such as MRTS and Nilgiri Mountain Railway; service classification is not explicitly encoded.
5. Some routes extend beyond what may be considered today's Southern Railway administrative territory. Administrative ownership should therefore be validated separately against a current railway-zone/division master.

## Cleaning methodology
1. Parsed each exported division object without changing station codes or names.
2. Converted each route into ordered station-stop records.
3. Preserved source ordering as the route sequence.
4. Parsed numeric cumulative distances where present.
5. Flagged, rather than automatically fixing, duplicates and naming discrepancies.
6. Represented unavailable metrics as missing/unknown rather than inferred values.

## Geographic mapping status
A true geographic map cannot be produced from this source alone because no station coordinates or line geometry are provided.

The supplied PNG is therefore a **schematic route-network visualization** based on station sequence. It is not geographically scaled and should not be presented as a map of physical railway geography.

## Recommended next dataset
To complete the requested GIS analysis, provide a station master containing at least:
`station_code, station_name, latitude, longitude, zone, division`

For actual track length and geometry, also provide a rail-track/route geometry dataset (GeoJSON, Shapefile, GeoPackage, or equivalent). With those inputs, each route can be converted to a Shapely `LineString`, measured in an appropriate projected CRS, mapped with GeoPandas/Folium, and checked for spatial gaps and orphaned stations.

## Outputs
- `sr_route_summary.csv` — one record per route line.
- `sr_cleaned_route_stops.csv` — normalized ordered station-stop records.
- `sr_route_network_schematic.png` — sequence/topology visualization.
