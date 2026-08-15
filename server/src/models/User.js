import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' }, // Maintained for legacy compatibility if needed
  role: { type: String, enum: ['ADMIN', 'ZONE_ADMIN', 'DIVISION_ADMIN', 'DATA_OPERATOR', 'VIEWER'], default: 'VIEWER' },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
  divisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Division' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const User = mongoose.model('User', schema);
