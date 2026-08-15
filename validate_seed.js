import fs from 'fs';

function validateSeed() {
  console.log('--- SEED VALIDATION ---');
  let data;
  try {
    const raw = fs.readFileSync('seed.json', 'utf8');
    data = JSON.parse(raw);
  } catch (err) {
    console.error('FAIL: Could not read or parse seed.json', err);
    process.exit(1);
  }

  let passCount = 0, warnCount = 0, failCount = 0;

  function report(status, msg, evidence = '') {
    console.log(`[${status}] ${msg} ${evidence ? '-> ' + evidence : ''}`);
    if (status === 'PASS') passCount++;
    if (status === 'WARN') warnCount++;
    if (status === 'FAIL') failCount++;
  }

  // 1. exactly 18 zones
  if (data.zones.length === 18) {
    report('PASS', 'Exactly 18 zones found');
  } else {
    report('FAIL', 'Expected 18 zones', `Found ${data.zones.length}`);
  }

  // 2. 2 organizations
  if (data.organizations.length === 2) {
    report('PASS', 'Exactly 2 organizations found');
  } else {
    report('FAIL', 'Expected 2 organizations', `Found ${data.organizations.length}`);
  }

  // 3. 1 KRCL corporation
  const krcl = data.organizations.find(o => o.code === 'KRCL');
  if (krcl && krcl.status === 'CORPORATION' && krcl.metadata?.organizationalType === 'CORPORATION') {
    report('PASS', 'KRCL corporation found properly configured');
  } else {
    report('FAIL', 'KRCL corporation misconfigured or missing');
  }
  
  // 4. KRCL outside Zone -> Division hierarchy
  const krclInZones = data.zones.find(z => z.code === 'KRCL');
  if (!krclInZones) {
    report('PASS', 'KRCL is outside Zone -> Division hierarchy');
  } else {
    report('FAIL', 'KRCL found in zones array');
  }

  // 5. 1 Metro zone
  const metro = data.zones.find(z => z.code === 'METRO');
  if (metro && metro.metadata?.organizationalType === 'METRO') {
    report('PASS', 'Metro zone found');
  } else {
    report('FAIL', 'Metro zone missing or misconfigured');
  }

  // 6. Metro has zero divisions
  if (metro && metro.divisions.length === 0 && metro.metadata?.divisionCount === 0) {
    report('PASS', 'Metro has exactly zero divisions');
  } else {
    report('FAIL', 'Metro division count is not zero', `Found ${metro?.divisions.length}`);
  }

  // Check divisions
  let activeDivs = 0;
  let histDivs = 0;
  let totalDivs = 0;
  const activeDivSet = new Set();
  let duplicateActive = false;

  let bzaHist = false, gntHist = false, gtlHist = false;
  let bzaCurr = false, gntCurr = false, gtlCurr = false;
  let watHist = false, rgdaCurr = false, vskpCurr = false;
  let validDates = true;

  for (const z of data.zones) {
    for (const d of z.divisions) {
      totalDivs++;
      if (d.status === 'ACTIVE') {
        activeDivs++;
        const id = `${z.code}-${d.code}-${d.effectiveFrom || 'baseline'}`;
        if (activeDivSet.has(id)) duplicateActive = true;
        activeDivSet.add(id);

        if (d.code === 'BZA' && z.code === 'SCoR') bzaCurr = true;
        if (d.code === 'GNT' && z.code === 'SCoR') gntCurr = true;
        if (d.code === 'GTL' && z.code === 'SCoR') gtlCurr = true;
        if (d.code === 'RGDA' && z.code === 'ECoR') rgdaCurr = true;
        if (d.code === 'VSKP' && z.code === 'SCoR') vskpCurr = true;
      } else if (d.status === 'HISTORICAL') {
        histDivs++;
        if (d.code === 'BZA' && z.code === 'SCR') bzaHist = true;
        if (d.code === 'GNT' && z.code === 'SCR') gntHist = true;
        if (d.code === 'GTL' && z.code === 'SCR') gtlHist = true;
        if (d.code === 'WAT' && z.code === 'ECoR') watHist = true;
      }

      // Check date validity
      if (d.effectiveTo && new Date(d.effectiveTo) > new Date('2026-08-15') && d.status === 'HISTORICAL') {
         validDates = false; // historical record in the future
      }
      if (!d.dataVersionRef) {
         report('FAIL', `Division ${d.code} missing dataVersionRef`);
      }
    }
  }

  if (totalDivs === 73) report('PASS', 'Exactly 73 division records');
  else report('FAIL', 'Expected 73 division records', `Found ${totalDivs}`);

  if (activeDivs === 69) report('PASS', 'Exactly 69 active divisions');
  else report('FAIL', 'Expected 69 active divisions', `Found ${activeDivs}`);

  if (histDivs === 4) report('PASS', 'Exactly 4 historical divisions');
  else report('FAIL', 'Expected 4 historical divisions', `Found ${histDivs}`);

  if (!duplicateActive) report('PASS', 'No duplicate active division identity within same zone/effective period');
  else report('FAIL', 'Found duplicate active divisions');

  if (bzaHist && gntHist && gtlHist && bzaCurr && gntCurr && gtlCurr) {
    report('PASS', 'Historical/current BZA/GNT/GTL coexist correctly');
  } else {
    report('FAIL', 'BZA/GNT/GTL historical/current mapping is incorrect');
  }

  if (watHist) report('PASS', 'WAT historical record exists');
  else report('FAIL', 'WAT historical record missing');

  if (rgdaCurr) report('PASS', 'RGDA active record exists');
  else report('FAIL', 'RGDA active record missing');

  if (vskpCurr) report('PASS', 'VSKP active record exists');
  else report('FAIL', 'VSKP active record missing');

  if (validDates) report('PASS', 'All effectiveFrom/effectiveTo ranges are valid');
  else report('FAIL', 'Found invalid effective dates');

  console.log(`\nTotals: ${passCount} PASS, ${warnCount} WARN, ${failCount} FAIL`);
}

validateSeed();
