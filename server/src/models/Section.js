import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  divisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Division', required: true },
  startStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  endStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  name: { type: String },
  status: { type: String, enum: ['ACTIVE', 'PROPOSED', 'REORGANIZED', 'HISTORICAL', 'CORPORATION'], default: 'ACTIVE' },
}, { timestamps: true });

export const Section = mongoose.model('Section', schema);
