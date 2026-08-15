import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  status: { type: String, enum: ['ACTIVE', 'PROPOSED', 'REORGANIZED', 'HISTORICAL', 'CORPORATION'], default: 'ACTIVE' },
}, { timestamps: true });

export const Zone = mongoose.model('Zone', schema);
