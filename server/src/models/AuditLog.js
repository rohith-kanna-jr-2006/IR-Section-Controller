import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed },
  username: { type: String },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.Mixed },
  changes: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  reason: { type: String }
}, { timestamps: true });

export const AuditLog = mongoose.model('AuditLog', schema);
