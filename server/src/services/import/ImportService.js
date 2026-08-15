/**
 * Handles the foundation for Data Import Architecture:
 * Parse -> Normalize -> Validate -> Preview -> Confirm -> Publish
 */
export class ImportService {
  
  static parseJSON(fileBuffer) {
    try {
      const data = JSON.parse(fileBuffer.toString('utf-8'));
      return { valid: true, data: Array.isArray(data) ? data : [data] };
    } catch (e) {
      return { valid: false, error: 'Invalid JSON format' };
    }
  }

  // Basic CSV parser for the foundation phase
  static parseCSV(fileBuffer) {
    try {
      const text = fileBuffer.toString('utf-8');
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) return { valid: false, error: 'CSV must contain headers and at least one row' };
      
      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, index) => {
          row[h] = values[index] || '';
        });
        data.push(row);
      }
      
      return { valid: true, data };
    } catch (e) {
      return { valid: false, error: 'Failed to parse CSV' };
    }
  }

  static parse(fileBuffer, mimeType) {
    if (mimeType === 'application/json' || mimeType === 'text/json') {
      return this.parseJSON(fileBuffer);
    } else if (mimeType === 'text/csv' || mimeType === 'application/csv') {
      return this.parseCSV(fileBuffer);
    } else {
      return { valid: false, error: 'Unsupported file format. Only JSON and CSV are supported.' };
    }
  }

  /**
   * Normalizes parsed data according to entity rules.
   */
  static normalize(data, entityType) {
    // Stub for normalization logic (e.g., upper casing codes, date parsing)
    return data.map(record => {
      const normalized = { ...record };
      if (normalized.code) normalized.code = normalized.code.toUpperCase();
      if (normalized.stationCode) normalized.stationCode = normalized.stationCode.toUpperCase();
      return normalized;
    });
  }

  /**
   * Validates normalized data and generates Preview Report
   */
  static validatePreview(normalizedData, zodSchema) {
    const report = {
      totalRecords: normalizedData.length,
      validRecords: 0,
      errors: [],
      warnings: [],
      canPublish: true,
      data: []
    };

    normalizedData.forEach((record, index) => {
      const result = zodSchema.safeParse(record);
      if (result.success) {
        report.validRecords++;
        report.data.push({ record, valid: true });
      } else {
        report.canPublish = false;
        report.data.push({ record, valid: false, errors: result.error.errors });
        report.errors.push(`Row ${index + 1}: ${result.error.errors.map(e => e.message).join(', ')}`);
      }
    });

    return report;
  }
}
