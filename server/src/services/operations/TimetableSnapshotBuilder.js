import crypto from 'crypto';
import { TrainSchedule } from '../../models/TrainSchedule.js';
import { TrainStop } from '../../models/TrainStop.js';
import { TimetableSnapshot } from '../../models/operations/TimetableSnapshot.js';

export class TimetableSnapshotBuilder {
  static async buildSnapshot(trainIds, sourceType, sourceId, dataVersionId) {
    const schedules = await TrainSchedule.find({ trainId: { $in: trainIds } }).lean();
    const scheduleIds = schedules.map(s => s._id);
    const stops = await TrainStop.find({ scheduleId: { $in: scheduleIds } }).lean();

    const combinedData = schedules.map(sched => ({
      ...sched,
      stops: stops.filter(stop => stop.scheduleId.toString() === sched._id.toString())
    }));

    const dataString = JSON.stringify(combinedData);
    const scheduleHash = crypto.createHash('sha256').update(dataString).digest('hex');

    const snapshot = new TimetableSnapshot({
      timetableSnapshotId: `TTS-${Date.now()}`,
      sourceType,
      sourceId,
      dataVersionId,
      scheduleHash,
      schedules: combinedData,
      verificationStatus: 'NOT VERIFIED'
    });

    await snapshot.save();
    return snapshot;
  }
}