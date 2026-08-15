import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  version: { type: String, required: true, unique: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source', required: true },
  verificationStatus: { 
    type: String, 
    enum: ['DRAFT', 'IMPORTED', 'VALIDATED', 'VERIFIED', 'PUBLISHED', 'REJECTED', 'SUPERSEDED'], 
    default: 'DRAFT' 
  },
  importedAt: { type: Date, default: Date.now },
  remarks: { type: String },
  notes: { type: String }
}, { timestamps: true });

export const DataVersion = mongoose.model('DataVersion', schema);
