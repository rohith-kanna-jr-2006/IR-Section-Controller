import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  version: { type: String, required: true, unique: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source', required: true },
  verificationStatus: { 
    type: String, 
    enum: ['PENDING', 'VERIFIED', 'REJECTED'], 
    default: 'PENDING' 
  },
  remarks: { type: String }
}, { timestamps: true });

export const DataVersion = mongoose.model('DataVersion', schema);
