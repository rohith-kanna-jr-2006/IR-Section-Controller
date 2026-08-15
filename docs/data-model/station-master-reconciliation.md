# Station Master Reconciliation

> [!WARNING]
> Dataset analysis = NOT VERIFIED  
> Route reconciliation = BLOCKED  
> Station import preview = BLOCKED  

The Southern Railway dataset was not provided in the workspace. As a result, the read-only analysis and reconciliation against the authoritative Station Master cannot be performed at this time.

## Objective (Pending Dataset)
To compare the Southern Railway station dataset against the newly established Station Master framework and classify records into:
- `MATCHED`: Code and name match existing active identity.
- `NEW`: Completely new station (requires mapping to Zone/Division).
- `DUPLICATE`: Multiple entries in the dataset for the same station code.
- `CONFLICT`: Station code matches but details (like name) diverge significantly.
- `UNKNOWN`: Malformed or missing station code.
- `REVIEW_REQUIRED`: Unresolved mappings or invalid statuses.

Once the dataset is provided, run the `analyze_southern_railway.js` pipeline to generate the results.
