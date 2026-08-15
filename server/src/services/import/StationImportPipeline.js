import { StationValidator } from '../validation/StationValidator.js';
import { Station } from '../../models/Station.js';

export class StationImportPipeline {
  constructor(sourceDataset) {
    this.sourceDataset = sourceDataset || [];
    this.results = {
      totalSourceRecords: 0,
      matched: [],
      newRecords: [],
      duplicates: [],
      conflicts: [],
      unknowns: [],
      reviewRequired: []
    };
  }

  /**
   * 1. SOURCE & 2. PARSE
   * In a real scenario, this reads from a file.
   * For the BLOCKED preview, it just uses the injected dataset if any.
   */
  async parse() {
    this.results.totalSourceRecords = this.sourceDataset.length;
    return this.sourceDataset;
  }

  /**
   * 3. NORMALIZE
   */
  normalize(record) {
    return {
      ...record,
      normalizedCode: StationValidator.normalizeStationCode(record.stationCode),
      normalizedName: StationValidator.normalizeStationName(record.officialName)
    };
  }

  /**
   * 4. MATCH & 5. VALIDATE
   */
  async matchAndValidate(normalizedRecord) {
    if (!normalizedRecord.normalizedCode) {
      return { status: 'UNKNOWN', record: normalizedRecord, reason: 'Missing station code' };
    }

    const existing = await Station.findOne({
      stationCode: normalizedRecord.normalizedCode,
      status: 'ACTIVE'
    });

    if (existing) {
      // Check if names match well enough, else it's a conflict or needs review
      const existingNormalizedName = StationValidator.normalizeStationName(existing.officialName);
      if (existingNormalizedName === normalizedRecord.normalizedName) {
        return { status: 'MATCHED', record: normalizedRecord, existingId: existing._id };
      } else {
        return { status: 'CONFLICT', record: normalizedRecord, existingId: existing._id, reason: 'Name mismatch' };
      }
    }

    // Check for duplicate in the current import batch (naive check)
    const duplicateInBatch = this.results.newRecords.find(r => r.normalizedCode === normalizedRecord.normalizedCode);
    if (duplicateInBatch) {
      return { status: 'DUPLICATE', record: normalizedRecord, reason: 'Duplicate in source dataset' };
    }

    // New record requires zone/division validation to be fully valid
    if (!normalizedRecord.zoneId || !normalizedRecord.divisionId) {
      return { status: 'REVIEW_REQUIRED', record: normalizedRecord, reason: 'Missing zone/division mapping' };
    }

    return { status: 'NEW', record: normalizedRecord };
  }

  /**
   * 6. PREVIEW
   */
  async runPreview() {
    if (this.sourceDataset.length === 0) {
      return {
        status: "BLOCKED",
        reason: "Southern Railway dataset not provided",
        datasetAnalysis: "NOT_VERIFIED",
        publishableRecords: 0
      };
    }

    const parsed = await this.parse();
    for (const record of parsed) {
      const normalized = this.normalize(record);
      const matchResult = await this.matchAndValidate(normalized);

      switch (matchResult.status) {
        case 'MATCHED': this.results.matched.push(matchResult); break;
        case 'NEW': this.results.newRecords.push(matchResult); break;
        case 'DUPLICATE': this.results.duplicates.push(matchResult); break;
        case 'CONFLICT': this.results.conflicts.push(matchResult); break;
        case 'UNKNOWN': this.results.unknowns.push(matchResult); break;
        case 'REVIEW_REQUIRED': this.results.reviewRequired.push(matchResult); break;
      }
    }

    return {
      status: "PREVIEW_READY",
      totalSourceRecords: this.results.totalSourceRecords,
      matched: this.results.matched.length,
      newRecords: this.results.newRecords.length,
      duplicates: this.results.duplicates.length,
      conflicts: this.results.conflicts.length,
      unknowns: this.results.unknowns.length,
      reviewRequired: this.results.reviewRequired.length,
      publishableRecords: this.results.newRecords.length
    };
  }

  /**
   * 7. HUMAN APPROVAL (Manual Step)
   * 8. PUBLISH (Future implementation)
   */
  async publish(approvedRecords) {
    throw new Error('Not implemented. Awaiting explicit user approval before publishing station records.');
  }
}
