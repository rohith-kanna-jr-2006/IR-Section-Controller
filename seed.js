import fs from 'fs';
import mongoose from 'mongoose';
import { Source } from './server/src/models/Source.js';
import { DataVersion } from './server/src/models/DataVersion.js';
import { Organization } from './server/src/models/Organization.js';
import { Zone } from './server/src/models/Zone.js';
import { Division } from './server/src/models/Division.js';

async function seed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ir-section-controller');
    console.log('MongoDB connected.');

    const seedData = JSON.parse(fs.readFileSync('seed.json', 'utf8'));

    // 1. Sources
    const sourceMap = {};
    for (const s of seedData.sources) {
      let doc = await Source.findOne({ code: s.code });
      if (!doc) {
        doc = await Source.create(s);
      }
      sourceMap[s.code] = doc._id;
    }
    console.log(`Sources processed: ${Object.keys(sourceMap).length}`);

    // 2. DataVersions
    const versionMap = {};
    for (const v of seedData.dataVersions) {
      let doc = await DataVersion.findOne({ version: v.version });
      if (!doc) {
        doc = await DataVersion.create({
          ...v,
          sourceId: sourceMap[v.sourceRef]
        });
      }
      versionMap[v.version] = doc._id;
    }
    console.log(`DataVersions processed: ${Object.keys(versionMap).length}`);

    // 3. Organizations
    const orgMap = {};
    for (const o of seedData.organizations) {
      let doc = await Organization.findOne({ code: o.code });
      if (!doc) {
        doc = await Organization.create(o);
      }
      orgMap[o.code] = doc._id;
    }
    console.log(`Organizations processed: ${Object.keys(orgMap).length}`);

    const irOrgId = orgMap['IR'];

    // 4. Zones & Divisions
    for (const z of seedData.zones) {
      let zoneDoc = await Zone.findOne({ code: z.code });
      if (!zoneDoc) {
        zoneDoc = await Zone.create({
          organizationId: irOrgId,
          name: z.name,
          code: z.code,
          headquarters: z.headquarters,
          status: z.status,
          dataVersionId: z.dataVersionRef ? versionMap[z.dataVersionRef] : undefined,
          effectiveFrom: z.effectiveFrom ? new Date(z.effectiveFrom) : undefined,
          effectiveTo: z.effectiveTo ? new Date(z.effectiveTo) : undefined,
          metadata: z.metadata
        });
      }

      for (const d of z.divisions || []) {
        // Find existing using compound identity: zoneId, code, dataVersionId
        const dvId = versionMap[d.dataVersionRef];
        let divDoc = await Division.findOne({ zoneId: zoneDoc._id, code: d.code, dataVersionId: dvId });
        if (!divDoc) {
          await Division.create({
            zoneId: zoneDoc._id,
            name: d.name,
            code: d.code,
            headquarters: d.headquarters,
            status: d.status,
            dataVersionId: dvId,
            effectiveFrom: d.effectiveFrom ? new Date(d.effectiveFrom) : undefined,
            effectiveTo: d.effectiveTo ? new Date(d.effectiveTo) : undefined,
            metadata: d.metadata
          });
        }
      }
    }
    console.log('Zones and Divisions processed.');

    // 5. Post-seed Validation Query
    console.log('\n--- POST-SEED VALIDATION ---');
    
    const orgCount = await Organization.countDocuments();
    console.log(`Organizations: ${orgCount} (Expected: 2)`);
    
    const zoneCount = await Zone.countDocuments();
    console.log(`Zones: ${zoneCount} (Expected: 18)`);
    
    const totalDivs = await Division.countDocuments();
    const activeDivs = await Division.countDocuments({ status: 'ACTIVE' });
    const histDivs = await Division.countDocuments({ status: 'HISTORICAL' });
    console.log(`Divisions: ${totalDivs} (Expected: 73)`);
    console.log(`Active Divisions: ${activeDivs} (Expected: 69)`);
    console.log(`Historical Divisions: ${histDivs} (Expected: 4)`);

    const metroZone = await Zone.findOne({ code: 'METRO' });
    const metroDivs = await Division.countDocuments({ zoneId: metroZone?._id });
    console.log(`Metro Zone: ${metroZone ? 'FOUND' : 'MISSING'}, Divisions: ${metroDivs} (Expected: 0)`);
    
    const krclOrg = await Organization.findOne({ code: 'KRCL' });
    console.log(`KRCL Corp: ${krclOrg ? 'FOUND' : 'MISSING'}`);
    const krclZone = await Zone.findOne({ code: 'KRCL' });
    console.log(`KRCL in Zones: ${krclZone ? 'FOUND' : 'NONE'} (Expected: NONE)`);
    
    process.exit(0);
  } catch (err) {
    console.error('Seed Failed:', err);
    process.exit(1);
  }
}

seed();
