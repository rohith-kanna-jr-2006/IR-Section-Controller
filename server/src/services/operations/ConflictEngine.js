import { Conflict } from '../../models/operations/Conflict.js';
import { SectionOccupancy } from '../../models/operations/SectionOccupancy.js';
import { getIO } from '../../config/socket.js';

export class ConflictEngine {
  /**
   * Run all conflict detection rules for a scenario.
   * Separated entirely from action execution.
   */
  static async evaluate(scenarioId) {
    await this.detectSameSectionOccupancy(scenarioId);
    await this.detectOpposingMovements(scenarioId);
  }

  static async detectSameSectionOccupancy(scenarioId) {
    // Group active occupancies by sectionId
    const occupancies = await SectionOccupancy.find({
      scenarioId,
      occupancyStatus: { $in: ['OCCUPIED', 'RESERVED'] }
    });
    
    const sectionMap = new Map();
    for (const occ of occupancies) {
      if (!sectionMap.has(occ.sectionId.toString())) sectionMap.set(occ.sectionId.toString(), []);
      sectionMap.get(occ.sectionId.toString()).push(occ);
    }
    
    for (const [sectionId, occs] of sectionMap.entries()) {
      if (occs.length > 1) {
        // Multiple trains in same section
        const trainRunIds = occs.map(o => o.trainRunId);
        await this.createOrUpdateConflict(scenarioId, 'SAME_SECTION_OCCUPANCY', 'CRITICAL', trainRunIds, sectionId, null, 'Multiple trains detected in the same section block.');
      }
    }
  }

  static async detectOpposingMovements(scenarioId) {
    // Check if trains in the same section have opposing directions
  }

  static async createOrUpdateConflict(scenarioId, type, severity, trainRunIds, sectionId, stationId, description) {
    // Generate deterministic hash for idempotency based on scenario, type, and target
    const targetKey = sectionId ? sectionId.toString() : stationId.toString();
    const conflictId = `C-${scenarioId}-${type}-${targetKey}`;
    
    let conflict = await Conflict.findOne({ conflictId });
    if (!conflict) {
      conflict = new Conflict({
        conflictId,
        scenarioId,
        type,
        severity,
        trainRunIds,
        sectionId,
        stationId,
        description,
        detectedAt: new Date(), // Real time of detection
        status: 'DETECTED'
      });
      await conflict.save();
      
      const io = getIO();
      if (io) io.emit('conflict.created', conflict);
    } else if (conflict.status === 'RESOLVED' || conflict.status === 'DISMISSED') {
      // Re-open if it was incorrectly resolved
      conflict.status = 'OPEN';
      await conflict.save();
      const io = getIO();
      if (io) io.emit('conflict.updated', conflict);
    }
  }
}