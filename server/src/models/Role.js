import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  permissions: [{ type: String }]
}, { timestamps: true });

export const Role = mongoose.model('Role', schema);
