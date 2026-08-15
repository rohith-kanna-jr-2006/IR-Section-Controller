import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  trainNumber: { type: String, required: true },
  trainNumberNormalized: { type: String },
  name: { type: String, required: true },
  trainType: { type: String },
  serviceCategory: { type: String },
  operator: { type: String },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true },
  status: { type: String, enum: ['ACTIVE', 'PROPOSED', 'HISTORICAL'], default: 'ACTIVE' },
  sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source' },
  dataVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'DataVersion' },
  verificationStatus: { type: String, enum: ['VERIFIED', 'NOT VERIFIED', 'REVIEW_REQUIRED', 'CONFLICT'], default: 'NOT VERIFIED' },
  authorityLevel: { type: String, enum: ['PRIMARY', 'SECONDARY', 'INFERRED'] }
}, { timestamps: true });

// Scoped uniqueness: Train number should be unique among ACTIVE trains
schema.index({ trainNumber: 1 }, { unique: true, partialFilterExpression: { status: 'ACTIVE' } });

export const Train = mongoose.model('Train', schema);
