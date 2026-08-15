import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  sourceType: { type: String, required: true }, // Ministry, Zonal, Publication, CRIS, Secondary
  sourceTitle: { type: String },
  sourceUrl: { type: String },
  sourceDate: { type: Date },
  retrievedAt: { type: Date },
  documentVersion: { type: String },
  checksum: { type: String },
  importDate: { type: Date, default: Date.now },
  notes: { type: String }
}, { timestamps: true });

export const Source = mongoose.model('Source', schema);
