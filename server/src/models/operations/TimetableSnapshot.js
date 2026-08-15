import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  timetableSnapshotId: { type: String, required: true, unique: true },
  sourceType: { type: String, required: true, enum: ['OFFICIAL_PRIMARY', 'OFFICIAL_PUBLICATION', 'GOVERNMENT_OPEN_DATA', 'SECONDARY_REFERENCE', 'SIMULATED'] },
  sourceId: { type: String },
  dataVersionId: { type: String },
  scheduleHash: { type: String, required: true },
  schedules: [{ type: mongoose.Schema.Types.Mixed }], // Array of locked TrainSchedule and TrainStop data
  verificationStatus: { type: String, enum: ['VERIFIED', 'NOT VERIFIED', 'REVIEW_REQUIRED', 'CONFLICT'], default: 'NOT VERIFIED' }
}, { timestamps: true });

export const TimetableSnapshot = mongoose.model('TimetableSnapshot', schema);
