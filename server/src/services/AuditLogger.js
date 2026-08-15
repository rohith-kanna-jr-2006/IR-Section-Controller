import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async (req, action, entityType, entityId, changes, reason) => {
  try {
    const userId = req.user ? req.user._id : null;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const logEntry = new AuditLog({
      userId,
      action,
      entityType,
      entityId,
      changes,
      ipAddress,
      reason
    });

    await logEntry.save();
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};
