import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  snapshotId: { type: String, required: true, unique: true },
  sourceAuthority: { type: String, required: true },
  sourceType: { type: String, required: true, enum: ['OFFICIAL_PRIMARY', 'OFFICIAL_PUBLICATION', 'GOVERNMENT_OPEN_DATA', 'SECONDARY_REFERENCE', 'SIMULATED'] },
  sourceId: { type: String },
  sourceVersion: { type: String },
  sections: [{ type: mongoose.Schema.Types.Mixed }], // Array of locked section data
  stations: [{ type: mongoose.Schema.Types.Mixed }], // Array of locked station data
  topologyHash: { type: String, required: true },
  verificationStatus: { type: String, enum: ['VERIFIED', 'NOT VERIFIED', 'REVIEW_REQUIRED', 'CONFLICT'], default: 'NOT VERIFIED' }
}, { timestamps: true });

export const TopologySnapshot = mongoose.model('TopologySnapshot', schema);