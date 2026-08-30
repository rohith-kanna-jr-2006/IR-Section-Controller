import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Source } from '../models/Source.js';
import { DataVersion } from '../models/DataVersion.js';
import { Organization } from '../models/Organization.js';
import { Zone } from '../models/Zone.js';
import { Division } from '../models/Division.js';
import { Station } from '../models/Station.js';
import { Section } from '../models/Section.js';
import { Train } from '../models/Train.js';
import { TrainSchedule } from '../models/TrainSchedule.js';
import { TrainStop } from '../models/TrainStop.js';
import { TopologySnapshot } from '../models/operations/TopologySnapshot.js';
import { TimetableSnapshot } from '../models/operations/TimetableSnapshot.js';
import { SimulationScenario } from '../models/operations/SimulationScenario.js';
import { TrainRun } from '../models/operations/TrainRun.js';
import { SectionOccupancy } from '../models/operations/SectionOccupancy.js';
import { Conflict } from '../models/operations/Conflict.js';
import { ControlEvent } from '../models/operations/ControlEvent.js';
import { ControllerRecommendation } from '../models/operations/ControllerRecommendation.js';
import { ScenarioKPI } from '../models/operations/ScenarioKPI.js';
import { Alert } from '../models/operations/Alert.js';
import { getAllSRStations, getAllSRSections, SR_DIVISIONS_MAP } from './srSectionsData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');

const stationCoordinates = {
  NDLS: [77.2197, 28.6139],
  HWH: [88.3426, 22.5850],
  CSMT: [72.8358, 18.9400],
  SBC: [77.5714, 12.9784],
  MAS: [80.2757, 13.0827],
  BZA: [80.6200, 16.5186],
  CBE: [76.9634, 11.0016],
  ED: [77.7274, 11.3410],
  SA: [78.1287, 11.6643],
  JTJ: [78.5833, 12.5333],
  KPD: [79.1333, 12.9667],
  AJJ: [79.6667, 13.0833],
  PGT: [76.6548, 10.7867],
  SRR: [76.2736, 10.7628],
  TVC: [76.9534, 8.4875],
  ERS: [76.2999, 9.9687],
  MDU: [78.1198, 9.9252],
  TPJ: [78.6856, 10.7905],
  DG: [77.9803, 10.3673],
  TNP: [80.2911, 13.1167],
  GDR: [79.8500, 14.0500],
  MS: [80.2600, 13.0800],
  VM: [79.4862, 11.9398],
  MSB: [80.2900, 13.0900],
  VLCY: [80.2200, 12.9700],
  CGL: [79.9800, 12.6800],
  PUDI: [79.5200, 13.5600]
};

export async function seedDatabase() {
  console.log('[AI Studio] Initializing and verifying database seed...');

  try {
    // 1. Read seed.json
    const seedJsonPath = path.join(rootDir, 'seed.json');
    let seedData = { sources: [], dataVersions: [], organizations: [], zones: [] };
    if (fs.existsSync(seedJsonPath)) {
      seedData = JSON.parse(fs.readFileSync(seedJsonPath, 'utf8'));
    }

    // Sources
    const sourceMap = {};
    for (const s of seedData.sources || []) {
      let doc = await Source.findOne({ code: s.code });
      if (!doc) {
        doc = await Source.create(s);
      }
      sourceMap[s.code] = doc._id;
    }

    // DataVersions
    const versionMap = {};
    for (const v of seedData.dataVersions || []) {
      let doc = await DataVersion.findOne({ version: v.version });
      if (!doc) {
        doc = await DataVersion.create({
          ...v,
          sourceId: sourceMap[v.sourceRef]
        });
      }
      versionMap[v.version] = doc._id;
    }

    // Organizations
    const orgMap = {};
    for (const o of seedData.organizations || []) {
      let doc = await Organization.findOne({ code: o.code });
      if (!doc) {
        doc = await Organization.create(o);
      }
      orgMap[o.code] = doc._id;
    }

    const irOrgId = orgMap['IR'];

    // Zones & Divisions
    const zoneMap = {};
    const divisionMap = {};

    for (const z of seedData.zones || []) {
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
      zoneMap[z.code] = zoneDoc;

      for (const d of z.divisions || []) {
        const dvId = versionMap[d.dataVersionRef];
        let divDoc = await Division.findOne({ zoneId: zoneDoc._id, code: d.code });
        if (!divDoc) {
          divDoc = await Division.create({
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
        divisionMap[d.code] = divDoc;
        divisionMap[d.name.toUpperCase()] = divDoc;
      }
    }

    // 2. Stations Seed
    const defaultZone = zoneMap['SR'] || Object.values(zoneMap)[0];
    const defaultDiv = divisionMap['MAS'] || divisionMap['CHENNAI'] || divisionMap['BB'] || Object.values(divisionMap)[0];

    const stationMap = {};

    // 2.1 Seed all Stations from the comprehensive SR Station Database
    const srStations = getAllSRStations();
    console.log(`[AI Studio] Seeding/Verifying ${srStations.length} Southern Railway stations...`);

    for (let i = 0; i < srStations.length; i++) {
      const srStn = srStations[i];
      const targetDiv = divisionMap[srStn.divisionCode] || divisionMap[srStn.divisionName?.toUpperCase()] || defaultDiv;
      const targetZone = zoneMap['SR'] || defaultZone;
      const coords = stationCoordinates[srStn.stationCode] || [
        76.5 + ((i * 13) % 40) * 0.1,
        8.5 + ((i * 17) % 55) * 0.1
      ];

      let stn = await Station.findOne({ stationCode: srStn.stationCode });
      if (!stn) {
        stn = await Station.create({
          divisionId: targetDiv._id,
          zoneId: targetZone._id,
          stationCode: srStn.stationCode,
          name: srStn.name,
          officialName: srStn.officialName || srStn.name,
          location: {
            type: 'Point',
            coordinates: coords
          },
          status: 'ACTIVE',
          verificationStatus: 'VERIFIED',
          authorityLevel: 'PRIMARY'
        });
      } else {
        // Ensure accurate division and verified status
        stn.name = srStn.name;
        stn.officialName = srStn.officialName || srStn.name;
        stn.divisionId = targetDiv._id;
        stn.zoneId = targetZone._id;
        stn.status = 'ACTIVE';
        stn.verificationStatus = 'VERIFIED';
        stn.authorityLevel = 'PRIMARY';
        await stn.save();
      }
      stationMap[srStn.stationCode] = stn;
    }

    // Also populate national junction stations
    const nationalStations = [
      { code: 'NDLS', name: 'New Delhi', zCode: 'NR', dCode: 'DLI' },
      { code: 'HWH', name: 'Howrah Junction', zCode: 'ER', dCode: 'HWH' },
      { code: 'CSMT', name: 'Mumbai CSMT', zCode: 'CR', dCode: 'BB' },
      { code: 'SBC', name: 'KSR Bengaluru', zCode: 'SWR', dCode: 'SBC' },
      { code: 'BZA', name: 'Vijayawada Junction', zCode: 'SCR', dCode: 'BZA' }
    ];

    for (const ns of nationalStations) {
      if (!stationMap[ns.code]) {
        const z = zoneMap[ns.zCode] || defaultZone;
        const d = divisionMap[ns.dCode] || defaultDiv;
        let stn = await Station.findOne({ stationCode: ns.code });
        const coords = stationCoordinates[ns.code] || [77.2197, 28.6139];
        if (!stn) {
          stn = await Station.create({
            divisionId: d._id,
            zoneId: z._id,
            stationCode: ns.code,
            name: ns.name,
            officialName: ns.name,
            location: {
              type: 'Point',
              coordinates: coords
            },
            status: 'ACTIVE',
            verificationStatus: 'VERIFIED',
            authorityLevel: 'PRIMARY'
          });
        }
        stationMap[ns.code] = stn;
      }
    }

    // Populate remaining from database if any
    const allDbStations = await Station.find();
    for (const st of allDbStations) {
      stationMap[st.stationCode] = st;
    }

    // 3. Sections Seed from the SR Sections Topology
    const sectionMap = {};
    const srSectionsList = getAllSRSections();
    console.log(`[AI Studio] Seeding/Verifying ${srSectionsList.length} Southern Railway corridor sections...`);

    for (const secDef of srSectionsList) {
      const fromStn = stationMap[secDef.fromStationCode];
      const toStn = stationMap[secDef.toStationCode];
      const targetDiv = divisionMap[secDef.divisionCode] || defaultDiv;
      const targetZone = zoneMap['SR'] || defaultZone;

      if (fromStn && toStn) {
        const code = `${secDef.fromStationCode}-${secDef.toStationCode}`;
        let sec = await Section.findOne({ sectionCode: code });
        const dist = Math.max(15, (secDef.totalStations - 1) * 8); // approximate distance if not specified

        if (!sec) {
          sec = await Section.create({
            sectionCode: code,
            name: secDef.routeName,
            fromStationId: fromStn._id,
            toStationId: toStn._id,
            divisionId: targetDiv._id,
            zoneId: targetZone._id,
            distanceKm: dist,
            direction: 'BOTH',
            status: 'ACTIVE'
          });
        } else {
          sec.name = secDef.routeName;
          sec.fromStationId = fromStn._id;
          sec.toStationId = toStn._id;
          sec.divisionId = targetDiv._id;
          sec.zoneId = targetZone._id;
          sec.distanceKm = dist;
          sec.status = 'ACTIVE';
          await sec.save();
        }
        sectionMap[code] = sec;
      }
    }

    const allDbSecs = await Section.find();
    for (const s of allDbSecs) {
      sectionMap[s.sectionCode] = s;
    }

    // 4. Trains Seed
    const trainMap = {};
    const existingTrainCount = await Train.countDocuments();
    if (existingTrainCount === 0) {
      const trainsToCreate = [
        { number: '12675', name: 'Kovai Superfast Express', type: 'SUPERFAST', op: 'SR', z: 'SR' },
        { number: '20607', name: 'Vande Bharat Express (MAS-MYS)', type: 'VANDE_BHARAT', op: 'SR', z: 'SR' },
        { number: '12007', name: 'Shatabdi Express (MAS-MYS)', type: 'SHATABDI', op: 'SR', z: 'SR' },
        { number: '12673', name: 'Cheran Superfast Express', type: 'SUPERFAST', op: 'SR', z: 'SR' },
        { number: '12625', name: 'Kerala Express', type: 'SUPERFAST', op: 'SR', z: 'SR' },
        { number: '12951', name: 'Mumbai Rajdhani Express', type: 'RAJDHANI', op: 'WR', z: 'WR' },
        { number: '12301', name: 'Howrah Rajdhani Express', type: 'RAJDHANI', op: 'ER', z: 'ER' },
        { number: '56001', name: 'Arakkonam Passenger', type: 'PASSENGER', op: 'SR', z: 'SR' },
        { number: 'BOXN_01', name: 'Freight Container (Coal/Steel)', type: 'FREIGHT', op: 'IR', z: 'SR' }
      ];

      for (const t of trainsToCreate) {
        const z = zoneMap[t.z] || defaultZone;
        const trainDoc = await Train.create({
          trainNumber: t.number,
          trainNumberNormalized: t.number.replace(/\D/g, ''),
          name: t.name,
          trainType: t.type,
          serviceCategory: 'PASSENGER_SF',
          operator: t.op,
          zoneId: z._id,
          status: 'ACTIVE',
          verificationStatus: 'VERIFIED',
          authorityLevel: 'PRIMARY'
        });
        trainMap[t.number] = trainDoc;

        // Schedule
        const sched = await TrainSchedule.create({
          trainId: trainDoc._id,
          scheduleCode: `SCHED_${t.number}`,
          version: 1,
          frequency: 'DAILY',
          operatingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          status: 'ACTIVE'
        });

        // Stops (MAS -> AJJ -> KPD -> JTJ -> SA -> ED -> CBE)
        const sampleStopCodes = ['MAS', 'AJJ', 'KPD', 'JTJ', 'SA', 'ED', 'CBE'];
        let seq = 1;
        let baseMins = 360; // 06:00 AM
        for (const stCode of sampleStopCodes) {
          const stDoc = stationMap[stCode] || (await Station.findOne({ stationCode: stCode }));
          if (stDoc) {
            const arrH = Math.floor(baseMins / 60).toString().padStart(2, '0');
            const arrM = (baseMins % 60).toString().padStart(2, '0');
            const depMins = baseMins + 5;
            const depH = Math.floor(depMins / 60).toString().padStart(2, '0');
            const depM = (depMins % 60).toString().padStart(2, '0');

            await TrainStop.create({
              scheduleId: sched._id,
              sequence: seq++,
              stationId: stDoc._id,
              stationCode: stCode,
              arrival: `${arrH}:${arrM}`,
              departure: `${depH}:${depM}`,
              absoluteMinutesArrival: baseMins,
              absoluteMinutesDeparture: depMins,
              haltMinutes: 5,
              dayOffset: 0,
              platform: '1'
            });
            baseMins += 50; // next station in 50 mins
          }
        }
      }
    } else {
      const allTrains = await Train.find();
      for (const t of allTrains) {
        trainMap[t.trainNumber] = t;
      }
    }

    // 5. Topology and Timetable Snapshots
    let topoSnapshot = await TopologySnapshot.findOne({ snapshotId: 'TOPO_SR_MAIN_V1' });
    if (!topoSnapshot) {
      topoSnapshot = await TopologySnapshot.create({
        snapshotId: 'TOPO_SR_MAIN_V1',
        sourceAuthority: 'SR_OPERATIONS',
        sourceType: 'OFFICIAL_PRIMARY',
        topologyHash: 'hash_topo_sr_001',
        verificationStatus: 'VERIFIED'
      });
    }

    let ttSnapshot = await TimetableSnapshot.findOne({ timetableSnapshotId: 'TT_SR_SUMMER_2026' });
    if (!ttSnapshot) {
      ttSnapshot = await TimetableSnapshot.create({
        timetableSnapshotId: 'TT_SR_SUMMER_2026',
        sourceType: 'OFFICIAL_PRIMARY',
        scheduleHash: 'hash_tt_sr_001',
        verificationStatus: 'VERIFIED'
      });
    }

    // 6. Simulation Scenarios Seed
    const existingScenarios = await SimulationScenario.countDocuments();
    if (existingScenarios === 0) {
      const scenariosToCreate = [
        {
          scenarioId: 'SCEN_PEAK_001',
          name: 'Morning Peak Hour Controller Operations (MAS-CBE)',
          status: 'READY',
          sourceType: 'SIMULATED',
          multiplier: 1,
          randomSeed: 1048576
        },
        {
          scenarioId: 'SCEN_WEATHER_002',
          name: 'Palakkad Gap Heavy Rain & Caution Orders',
          status: 'RUNNING',
          sourceType: 'SIMULATED',
          multiplier: 2,
          randomSeed: 2097152
        },
        {
          scenarioId: 'SCEN_REPLAY_003',
          name: 'Historic Replay: Cyclone Michaung Evacuation',
          status: 'COMPLETED',
          sourceType: 'REPLAY',
          multiplier: 1,
          randomSeed: 3141592
        },
        {
          scenarioId: 'SCEN_MAINT_004',
          name: 'Night Track Maintenance & Line Block',
          status: 'COMPLETED',
          sourceType: 'SIMULATED',
          multiplier: 1,
          randomSeed: 4194304
        }
      ];

      for (const sc of scenariosToCreate) {
        const createdScen = await SimulationScenario.create({
          scenarioId: sc.scenarioId,
          name: sc.name,
          status: sc.status,
          sourceType: sc.sourceType,
          multiplier: sc.multiplier,
          randomSeed: sc.randomSeed,
          simulationClockTime: new Date(),
          topologySnapshotId: topoSnapshot._id,
          timetableSnapshotId: ttSnapshot._id
        });

        // Seed TrainRuns for this scenario
        const trainList = await Train.find().limit(5);
        const sectionList = await Section.find().limit(5);
        const stationList = await Station.find().limit(10);

        const runs = [];
        let runIndex = 1;
        for (const tr of trainList) {
          const sched = await TrainSchedule.findOne({ trainId: tr._id });
          const curSec = sectionList[(runIndex - 1) % sectionList.length];
          const curStn = stationList[(runIndex - 1) % stationList.length];
          const nextStn = stationList[runIndex % stationList.length];

          const trRun = await TrainRun.create({
            trainRunId: `RUN_${sc.scenarioId}_${tr.trainNumber}`,
            trainId: tr._id,
            scheduleId: sched ? sched._id : undefined,
            scenarioId: createdScen._id,
            serviceDate: new Date().toISOString().split('T')[0],
            runStatus: 'RUNNING',
            priorityClass: tr.trainType === 'VANDE_BHARAT' ? 'HIGH' : 'NORMAL',
            currentSectionId: curSec ? curSec._id : undefined,
            currentStationId: curStn ? curStn._id : undefined,
            nextStationId: nextStn ? nextStn._id : undefined,
            delayMinutes: (runIndex * 4) % 25,
            startedAt: new Date()
          });
          runs.push(trRun);

          // Section occupancy
          if (curSec) {
            await SectionOccupancy.create({
              sectionId: curSec._id,
              trainRunId: trRun._id,
              scenarioId: createdScen._id,
              entryTime: new Date(Date.now() - 10 * 60000),
              expectedExitTime: new Date(Date.now() + 20 * 60000),
              occupancyStatus: 'OCCUPIED',
              direction: 'DOWN',
              sourceType: 'SIMULATED'
            });
          }
          runIndex++;
        }

        // Seed Conflict
        if (runs.length >= 2) {
          const conf = await Conflict.create({
            conflictId: `CONF_${sc.scenarioId}_001`,
            scenarioId: createdScen._id,
            type: 'CROSSING_PRECEDENCE_CONFLICT',
            severity: 'HIGH',
            trainRunIds: [runs[0]._id, runs[1]._id],
            sectionId: sectionList[0]?._id,
            stationId: stationList[0]?._id,
            detectedAt: new Date(),
            description: `Precedence conflict at Katpadi Junction between ${runs[0].trainRunId} and ${runs[1].trainRunId}`,
            status: 'DETECTED'
          });

          // Controller Recommendation
          await ControllerRecommendation.create({
            recommendationId: `REC_${sc.scenarioId}_001`,
            scenarioId: sc.scenarioId,
            topologySnapshotId: topoSnapshot.snapshotId,
            timetableSnapshotId: ttSnapshot.timetableSnapshotId,
            engineVersion: 'v1.4.0-ai',
            status: 'PROPOSED',
            type: 'LOOP_PRECEDENCE_OVERTAKE',
            actionPayload: {
              actionType: 'HOLD_AND_PRECEDE',
              holdTrainRunId: runs[1].trainRunId,
              priorityTrainRunId: runs[0].trainRunId,
              holdingStation: 'Katpadi Junction (KPD)',
              expectedDelayRecoveryMin: 14
            },
            predictionConfidence: 94,
            recommendationScore: 88,
            conflictIds: [conf.conflictId],
            affectedTrainRunIds: [runs[0].trainRunId, runs[1].trainRunId],
            evidence: {
              triggeringConflicts: [conf.conflictId],
              predictedDelay: 6,
              affectedTrains: [runs[0].trainRunId, runs[1].trainRunId],
              alternatives: ['REROUTE_VIA_CHITTOOR', 'MAINTAIN_SLOT_DISPATCH'],
              calculationTimestamp: new Date()
            }
          });
        }

        // Seed Alert
        await Alert.create({
          alertId: `ALERT_${sc.scenarioId}_001`,
          scenarioId: createdScen._id,
          type: 'CAUTION_ORDER_ACTIVE',
          severity: 'MEDIUM',
          message: 'Speed restriction (30 km/h) active between Arakkonam and Katpadi due to engineering works',
          detectedAt: new Date(),
          status: 'OPEN'
        });

        // Seed ControlEvent
        await ControlEvent.create({
          eventType: 'SECTION_DISPATCH',
          timestamp: new Date(),
          trainRunId: runs[0]?._id,
          sectionId: sectionList[0]?._id,
          scenarioId: createdScen._id,
          sourceType: 'SIMULATED',
          metadata: { signalAspect: 'GREEN', routeId: 'MAIN_LINE_DOWN' }
        });

        // Seed ScenarioKPI if completed
        if (sc.status === 'COMPLETED') {
          await ScenarioKPI.create({
            scenarioId: createdScen._id,
            totalTrains: 18,
            completedTrains: 17,
            cancelledTrains: 1,
            totalDelayMinutes: 42,
            averageDelayMinutes: 2.3,
            maxDelayMinutes: 12,
            criticalConflicts: 1,
            highConflicts: 3,
            resolvedConflicts: 4,
            unresolvedConflicts: 0,
            throughput: 94.4,
            scenarioDurationMinutes: 180,
            topologySnapshotId: topoSnapshot._id,
            timetableSnapshotId: ttSnapshot._id
          });
        }
      }
    }

    console.log('[AI Studio] Database initialization and seed complete!');
  } catch (error) {
    console.error('[AI Studio] Error during database seeding:', error);
  }
}
