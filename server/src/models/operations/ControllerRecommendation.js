import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  recommendationId: { type: String, required: true, unique: true },
  scenarioId: { type: String, required: true },
  topologySnapshotId: { type: String, required: true },
  timetableSnapshotId: { type: String, required: true },
  engineVersion: { type: String, required: true },
  
  status: { 
    type: String, 
    enum: ['PROPOSED', 'UNDER_REVIEW', 'WHAT_IF_EVALUATED', 'APPROVED', 'REJECTED', 'EXECUTED_SIMULATION', 'EXPIRED', 'SUPERSEDED', 'INVALID', 'UNSAFE'], 
    default: 'PROPOSED' 
  },
  
  type: { type: String, required: true },
  actionPayload: { type: mongoose.Schema.Types.Mixed, required: true },
  
  predictionConfidence: { type: Number, required: true, min: 0, max: 100 },
  recommendationScore: { type: Number, required: true },
  
  predictionInputs: { type: mongoose.Schema.Types.Mixed },
  conflictIds: [{ type: String }],
  affectedTrainRunIds: [{ type: String }],
  affectedSectionIds: [{ type: String }],
  alternativeRecommendationIds: [{ type: String }],
  
  evidence: {
    triggeringConflicts: [{ type: String }],
    predictedDelay: { type: Number },
    affectedTrains: [{ type: String }],
    affectedSections: [{ type: String }],
    constraintViolations: [{ type: String }],
    baselineKpi: { type: mongoose.Schema.Types.Mixed },
    projectedKpi: { type: mongoose.Schema.Types.Mixed },
    alternatives: [{ type: String }],
    calculationTimestamp: { type: Date }
  },

  generatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
}, { timestamps: true });

export const ControllerRecommendation = mongoose.model('ControllerRecommendation', schema);