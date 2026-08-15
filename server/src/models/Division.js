import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true },
  name: { type: String, required: true },
  shortName: { type: String },
  code: { type: String, required: true },
  headquarters: { type: String },
  status: { type: String, enum: ['ACTIVE', 'PROPOSED', 'REORGANIZED', 'HISTORICAL', 'CORPORATION'], default: 'ACTIVE' },
  sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source' },
  dataVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'DataVersion' },
  effectiveFrom: { type: Date },
  effectiveTo: { type: Date },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Compound identity strategy: A division code is unique within a zone for a specific data version/temporal state.
schema.index({ zoneId: 1, code: 1, dataVersionId: 1 }, { unique: true });

export const Division = mongoose.model('Division', schema);
