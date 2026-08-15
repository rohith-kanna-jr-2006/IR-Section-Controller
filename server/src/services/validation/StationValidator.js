import { Station } from '../../models/Station.js';

export class StationValidator {
  /**
   * Normalizes a station code (uppercase, trim).
   */
  static normalizeStationCode(code) {
    if (!code) return null;
    return code.trim().toUpperCase();
  }

  /**
   * Normalizes a station name for search/matching purposes.
   * Does NOT modify the authoritative officialName.
   */
  static normalizeStationName(name) {
    if (!name) return null;
    return name
      .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remove accents
      .toLowerCase()
      .replace(/[^\w\s]/gi, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
  }

  /**
   * Validates temporal identity to prevent overlapping ACTIVE stations with the same code.
   * Returns { valid: boolean, message?: string }
   */
  static async validateTemporalIdentity(stationCode, effectiveFrom, effectiveTo, excludeStationId = null) {
    if (!stationCode) return { valid: false, message: 'Station code is required' };

    const query = {
      stationCode,
      status: 'ACTIVE'
    };

    if (excludeStationId) {
      query._id = { $ne: excludeStationId };
    }

    const existingStations = await Station.find(query);

    if (existingStations.length === 0) {
      return { valid: true };
    }

    const newStart = effectiveFrom ? new Date(effectiveFrom).getTime() : -Infinity;
    const newEnd = effectiveTo ? new Date(effectiveTo).getTime() : Infinity;

    for (const existing of existingStations) {
      const extStart = existing.effectiveFrom ? new Date(existing.effectiveFrom).getTime() : -Infinity;
      const extEnd = existing.effectiveTo ? new Date(existing.effectiveTo).getTime() : Infinity;

      // Check overlap: (StartA <= EndB) and (EndA >= StartB)
      if (newStart <= extEnd && newEnd >= extStart) {
        return {
          valid: false,
          message: `Temporal overlap detected with existing ACTIVE station ${stationCode} (ID: ${existing._id})`
        };
      }
    }

    return { valid: true };
  }
}
