import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  documentReference: { type: String },
  sourceDate: { type: Date },
  importDate: { type: Date, default: Date.now },
  description: { type: String }
}, { timestamps: true });

export const Source = mongoose.model('Source', schema);
