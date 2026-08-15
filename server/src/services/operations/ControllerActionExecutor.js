import { ControllerSession } from '../../models/operations/ControllerSession.js';
import { ControlEvent } from '../../models/operations/ControlEvent.js';
import { TrainRun } from '../../models/operations/TrainRun.js';
import { Conflict } from '../../models/operations/Conflict.js';
import { getIO } from '../../config/socket.js';

export class ControllerActionExecutor {
  /**
   * Execute an idempotent action bound to a controller session
   */
  static async executeAction(sessionId, actionId, actionType, payload) {
    const session = await ControllerSession.findOne({ sessionId });
    if (!session) throw new Error('Session not found or invalid');
    if (session.status !== 'ACTIVE') throw new Error('Session is not active');
    
    // Idempotency check
    if (session.actionIds.includes(actionId)) {
      return { status: 'IGNORED', reason: 'Duplicate actionId' };
    }

    let result;
    switch (actionType) {
      case 'HOLD_TRAIN':
        result = await this.holdTrain(payload.trainRunId, session, actionId);
        break;
      case 'RELEASE_TRAIN':
        result = await this.releaseTrain(payload.trainRunId, session, actionId);
        break;
      case 'ACKNOWLEDGE_CONFLICT':
        result = await this.acknowledgeConflict(payload.conflictId, session, actionId);
        break;
      case 'RESOLVE_CONFLICT':
        result = await this.resolveConflict(payload.conflictId, session, actionId);
        break;
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }

    session.actionIds.push(actionId);
    await session.save();

    return result;
  }

  static async holdTrain(trainRunId, session, actionId) {
    const run = await TrainRun.findById(trainRunId);
    if (!run) throw new Error('TrainRun not found');
    
    const prevStatus = run.runStatus;
    run.runStatus = 'HELD';
    await run.save();

    await this.logEvent('TRAIN_HELD', { trainRunId, previousStatus: prevStatus }, session);
    return { success: true, runStatus: 'HELD' };
  }

  static async releaseTrain(trainRunId, session, actionId) {
    const run = await TrainRun.findById(trainRunId);
    if (!run) throw new Error('TrainRun not found');
    
    run.runStatus = 'RUNNING';
    await run.save();

    await this.logEvent('TRAIN_RELEASED', { trainRunId }, session);
    return { success: true, runStatus: 'RUNNING' };
  }

  static async acknowledgeConflict(conflictId, session, actionId) {
    const conflict = await Conflict.findById(conflictId);
    if (!conflict) throw new Error('Conflict not found');
    
    conflict.status = 'ACKNOWLEDGED';
    await conflict.save();

    await this.logEvent('CONFLICT_ACKNOWLEDGED', { conflictId }, session);
    
    const io = getIO();
    if (io) io.emit('conflict.updated', conflict);
    
    return { success: true };
  }

  static async resolveConflict(conflictId, session, actionId) {
    const conflict = await Conflict.findById(conflictId);
    if (!conflict) throw new Error('Conflict not found');
    
    conflict.status = 'RESOLVED';
    await conflict.save();

    await this.logEvent('CONFLICT_RESOLVED', { conflictId }, session);
    
    const io = getIO();
    if (io) io.emit('conflict.updated', conflict);
    
    return { success: true };
  }

  static async logEvent(eventType, payload, session) {
    const event = new ControlEvent({
      eventType,
      timestamp: new Date(),
      sessionId: session._id,
      scenarioId: session.scenarioId,
      trainRunId: payload.trainRunId,
      sourceType: 'SIMULATED',
      metadata: payload
    });
    await event.save();
    
    const io = getIO();
    if (io) io.emit('controller.action', event);
  }
}