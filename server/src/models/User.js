import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const User = mongoose.model('User', schema);
