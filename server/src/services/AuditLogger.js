import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async (req, action, entityType, entityId, changes, reason) => {
  try {
    let userId = null;
    let username = null;

    if (req?.user) {
      if (typeof req.user === 'string') {
        username = req.user;
        userId = req.user;
      } else {
        username = req.user.username || req.user.name || req.user.role || 'system';
        userId = req.user._id || req.user.id || req.user.userId || req.user.username || 'admin';
      }
    }

    const ipAddress = req?.ip || req?.connection?.remoteAddress || req?.socket?.remoteAddress || '127.0.0.1';

    const logEntry = new AuditLog({
      userId,
      username,
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

export class AuditLogger {
  static async log({ action, entityType, entityId, user, changes, metadata, reason, ipAddress }) {
    return logAudit(
      { user: typeof user === 'string' ? { _id: user, username: user } : user, ip: ipAddress },
      action,
      entityType,
      entityId,
      changes || metadata,
      reason
    );
  }
}
