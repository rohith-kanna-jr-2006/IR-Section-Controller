import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  trainNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  trainType: { type: String },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true },
  status: { type: String, enum: ['ACTIVE', 'PROPOSED', 'HISTORICAL'], default: 'ACTIVE' },
}, { timestamps: true });

export const Train = mongoose.model('Train', schema);
