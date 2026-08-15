import crypto from 'crypto';
import { Station } from '../../models/Station.js';
import { Section } from '../../models/Section.js';
import { TopologySnapshot } from '../../models/operations/TopologySnapshot.js';

export class TopologySnapshotBuilder {
  static async buildSnapshot(sourceAuthority, sourceType, sourceId, sourceVersion) {
    const stations = await Station.find().lean();
    const sections = await Section.find().lean();

    const dataString = JSON.stringify({ stations, sections });
    const topologyHash = crypto.createHash('sha256').update(dataString).digest('hex');

    const snapshot = new TopologySnapshot({
      snapshotId: `TS-${Date.now()}`,
      sourceAuthority,
      sourceType,
      sourceId,
      sourceVersion,
      stations,
      sections,
      topologyHash,
      verificationStatus: 'NOT VERIFIED'
    });

    await snapshot.save();
    return snapshot;
  }
}