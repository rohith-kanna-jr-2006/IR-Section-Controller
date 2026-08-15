import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  sectionCode: { type: String },
  name: { type: String },
  fromStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  toStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  divisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Division', required: true },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
  distanceKm: { type: Number },
  direction: { type: String },
  status: { type: String, enum: ['ACTIVE', 'PROPOSED', 'REORGANIZED', 'HISTORICAL', 'CORPORATION'], default: 'ACTIVE' },
  sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source' },
  dataVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'DataVersion' }
}, { timestamps: true });

export const Section = mongoose.model('Section', schema);
