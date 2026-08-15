import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  divisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Division', required: true },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' }, // for performance/denormalization
  stationCode: { type: String, required: true },
  name: { type: String, required: true },
  officialName: { type: String },
  shortName: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] } // [longitude, latitude]
  },
  stationType: { type: String },
  status: { type: String, enum: ['ACTIVE', 'PROPOSED', 'REORGANIZED', 'HISTORICAL', 'CORPORATION'], default: 'ACTIVE' },
  sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source' },
  dataVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'DataVersion' },
  effectiveFrom: { type: Date },
  effectiveTo: { type: Date }
}, { timestamps: true });

// GeoJSON index
schema.index({ location: '2dsphere' });

// Scoped uniqueness: Station code should be unique among ACTIVE stations
schema.index({ stationCode: 1 }, { unique: true, partialFilterExpression: { status: 'ACTIVE' } });

export const Station = mongoose.model('Station', schema);
