import { Station } from '../../models/Station.js';
import { Division } from '../../models/Division.js';
import { Section } from '../../models/Section.js';

export class HierarchyValidator {
  
  /**
   * Validates that Station.divisionId -> Division.zoneId == Station.zoneId
   */
  static async validateStationHierarchy(divisionId, zoneId) {
    if (!divisionId || !zoneId) return { valid: false, message: 'divisionId and zoneId are required' };
    
    const division = await Division.findById(divisionId).select('zoneId');
    if (!division) {
      return { valid: false, message: 'Division not found' };
    }
    
    if (division.zoneId.toString() !== zoneId.toString()) {
      return { 
        valid: false, 
        message: `Hierarchy mismatch: Division belongs to zone ${division.zoneId}, but station specifies zone ${zoneId}` 
      };
    }
    
    return { valid: true };
  }

  /**
   * Validates that a Section's divisionId and zoneId are consistent with its stations.
   * A section connects two stations. Usually, they belong to the same division. 
   * If they cross divisions, the section must explicitly define which division it belongs to.
   * Here we validate that the section's zoneId matches its divisionId's zoneId.
   */
  static async validateSectionHierarchy(divisionId, zoneId, fromStationId, toStationId) {
    if (!divisionId || !zoneId || !fromStationId || !toStationId) {
      return { valid: false, message: 'Missing required hierarchy fields for Section' };
    }

    const division = await Division.findById(divisionId).select('zoneId');
    if (!division) {
      return { valid: false, message: 'Division not found' };
    }

    if (division.zoneId.toString() !== zoneId.toString()) {
      return { 
        valid: false, 
        message: `Hierarchy mismatch: Division belongs to zone ${division.zoneId}, but section specifies zone ${zoneId}` 
      };
    }

    // Optional: could validate that fromStation and toStation actually exist
    const fromStation = await Station.findById(fromStationId);
    const toStation = await Station.findById(toStationId);

    if (!fromStation) return { valid: false, message: 'fromStationId not found' };
    if (!toStation) return { valid: false, message: 'toStationId not found' };

    return { valid: true };
  }
}
