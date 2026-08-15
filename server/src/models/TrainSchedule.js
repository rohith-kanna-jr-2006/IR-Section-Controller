import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  trainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
  frequency: { type: String },
  operatingDays: [{ type: Number }],
  validFrom: { type: Date },
  validTo: { type: Date },
  exceptions: { type: [Date] },
  sourceId: { type: String },
  version: { type: Number, default: 1 },
  verificationStatus: { type: String, enum: ['UNVERIFIED', 'VERIFIED'], default: 'UNVERIFIED' }
}, { timestamps: true });

export const TrainSchedule = mongoose.model('TrainSchedule', schema);
