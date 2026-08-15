import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  trainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
  scheduleCode: { type: String },
  version: { type: Number, default: 1 },
  scheduleType: { type: String },
  frequency: { type: String, enum: ['DAILY', 'WEEKLY', 'BI_WEEKLY', 'SPECIAL', 'SEASONAL', 'EXCEPT_DAYS', 'CUSTOM'] },
  operatingDays: [{ type: String, enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] }],
  validFrom: { type: Date },
  validTo: { type: Date },
  exceptions: { type: [Date] },
  status: { type: String, enum: ['ACTIVE', 'PROPOSED', 'HISTORICAL'], default: 'ACTIVE' },
  sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source' },
  dataVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'DataVersion' },
  verificationStatus: { type: String, enum: ['VERIFIED', 'NOT VERIFIED', 'REVIEW_REQUIRED', 'CONFLICT'], default: 'NOT VERIFIED' },
  authorityLevel: { type: String, enum: ['PRIMARY', 'SECONDARY', 'INFERRED'] }
}, { timestamps: true });

export const TrainSchedule = mongoose.model('TrainSchedule', schema);
