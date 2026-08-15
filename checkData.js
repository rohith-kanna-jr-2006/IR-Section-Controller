import mongoose from 'mongoose';
import { Organization } from './server/src/models/Organization.js';
import { Zone } from './server/src/models/Zone.js';
import { Division } from './server/src/models/Division.js';
import { Station } from './server/src/models/Station.js';
import { Section } from './server/src/models/Section.js';
import { Train } from './server/src/models/Train.js';
import { TrainSchedule } from './server/src/models/TrainSchedule.js';
import { TrainStop } from './server/src/models/TrainStop.js';
import { Source } from './server/src/models/Source.js';
import { DataVersion } from './server/src/models/DataVersion.js';
import { User } from './server/src/models/User.js';
import { Role } from './server/src/models/Role.js';
import { AuditLog } from './server/src/models/AuditLog.js';

async function checkData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ir-section-controller');
    console.log('MongoDB connected (Read-only Inspection)');
    
    const models = {
      organizations: Organization,
      zones: Zone,
      divisions: Division,
      stations: Station,
      sections: Section,
      trains: Train,
      trainSchedules: TrainSchedule,
      trainStops: TrainStop,
      sources: Source,
      dataVersions: DataVersion,
      users: User,
      roles: Role,
      auditLogs: AuditLog
    };

    console.log('\n--- COLLECTION COUNTS ---');
    let totalDocs = 0;
    
    for (const [name, model] of Object.entries(models)) {
      const count = await model.countDocuments();
      console.log(`${name}: ${count}`);
      totalDocs += count;
      
      if (count > 0) {
        const sample = await model.findOne().lean();
        console.log(`\n--- Sample from ${name} ---`);
        // Omit passwords/tokens for users
        if (name === 'users' && sample.passwordHash) {
          sample.passwordHash = '*** HIDDEN ***';
        }
        console.log(JSON.stringify(sample, null, 2));
      }
    }

    console.log('\n--- INSPECTION COMPLETE ---');
    console.log(`Total Documents across inspected collections: ${totalDocs}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
