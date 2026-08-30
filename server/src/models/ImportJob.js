import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  importId: { type: String, required: true, unique: true },
  format: { 
    type: String, 
    enum: ['TEXT', 'JSON', 'PDF', 'IMAGE', 'GTFS', 'AUTO'], 
    required: true 
  },
  filename: { type: String },
  fileSize: { type: Number },
  status: { 
    type: String, 
    enum: [
      'UPLOADED', 
      'PARSING', 
      'NORMALIZING', 
      'MATCHING', 
      'VALIDATING', 
      'REVIEW_REQUIRED', 
      'APPROVED', 
      'PUBLISHED', 
      'FAILED', 
      'CANCELLED'
    ], 
    default: 'UPLOADED' 
  },
  sourceProvenance: {
    sourceType: { 
      type: String, 
      enum: [
        'OFFICIAL_PRIMARY', 
        'OFFICIAL_PUBLICATION', 
        'GOVERNMENT_OPEN_DATA', 
        'SECONDARY_REFERENCE', 
        'USER_PROVIDED', 
        'OCR_EXTRACTED'
      ],
      default: 'USER_PROVIDED'
    },
    sourceAuthority: { type: String, default: 'CONTROLLER_INPUT' },
    authorityLevel: { 
      type: String, 
      enum: ['PRIMARY', 'SECONDARY', 'INFERRED'], 
      default: 'SECONDARY' 
    },
    verificationStatus: { 
      type: String, 
      enum: ['VERIFIED', 'NOT VERIFIED', 'REVIEW_REQUIRED', 'CONFLICT'], 
      default: 'NOT VERIFIED' 
    }
  },
  targetType: { 
    type: String, 
    enum: ['EXISTING_SCENARIO', 'NEW_SCENARIO', 'REFERENCE_DATASET'], 
    default: 'NEW_SCENARIO' 
  },
  targetScenarioId: { type: String },
  targetScenarioName: { type: String },
  rawInput: { type: String },
  parsedData: [{ type: mongoose.Schema.Types.Mixed }], // CanonicalTrainTimetable[]
  counts: {
    trains: { type: Number, default: 0 },
    stations: { type: Number, default: 0 },
    stops: { type: Number, default: 0 },
    validStops: { type: Number, default: 0 },
    warnings: { type: Number, default: 0 },
    errors: { type: Number, default: 0 },
    reviewRequired: { type: Number, default: 0 }
  },
  warnings: [{ type: String }],
  errors: [{ type: String }],
  publishedSnapshotId: { type: String },
  publishedAt: { type: Date },
  createdBy: { type: String, default: 'CONTROLLER' }
}, { timestamps: true, suppressReservedKeysWarning: true });

schema.index({ status: 1 });
schema.index({ createdAt: -1 });

export const ImportJob = mongoose.model('ImportJob', schema);
