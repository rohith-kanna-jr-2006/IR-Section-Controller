import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  snapshotId: { type: String, required: true, unique: true },
  sourceAuthority: { type: String, required: true },
  sourceType: { type: String, required: true, enum: ['SIMULATED', 'LIVE', 'REPLAY', 'UNKNOWN'] },
  sourceVersion: { type: String },
  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
  stations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Station' }],
  verificationStatus: { type: String, enum: ['VERIFIED', 'NOT VERIFIED', 'REVIEW_REQUIRED', 'CONFLICT'], default: 'NOT VERIFIED' }
}, { timestamps: true });

export const TopologySnapshot = mongoose.model('TopologySnapshot', schema);