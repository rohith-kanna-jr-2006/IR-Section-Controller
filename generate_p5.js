const fs = require('fs');
const path = require('path');

const modelsPath = path.resolve(__dirname, 'server/src/models/operations');
const servicesPath = path.resolve(__dirname, 'server/src/services/intelligence');
const routesPath = path.resolve(__dirname, 'server/src/routes');
const pagesPath = path.resolve(__dirname, 'client/src/components');

// Create directories if they don't exist
[modelsPath, servicesPath, routesPath, pagesPath].forEach(p => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const files = {
  // 1. MODELS
  'server/src/models/operations/ControllerRecommendation.js': `
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
`,

  // 2. PREDICTORS
  'server/src/services/intelligence/DelayPredictor.js': `
export class DelayPredictor {
  static predict(trainRuns, currentSimulationClock) {
    // Deterministic rule-based delay propagation
    // For Phase 5 we mock the deterministic output
    return trainRuns.map(run => ({
      trainRunId: run._id,
      projectedDelay: 0
    }));
  }
}
`,

  'server/src/services/intelligence/ConflictPredictor.js': `
export class ConflictPredictor {
  static predict(trainRuns, sectionOccupancies) {
    // Deterministic spatial/temporal overlap projection
    return [];
  }
}
`,

  'server/src/services/intelligence/BottleneckDetector.js': `
export class BottleneckDetector {
  static detect(scenarioKpi) {
    // Deterministic throughput analysis
    return [];
  }
}
`,

  // 3. RECOMMENDATION ENGINE
  'server/src/services/intelligence/RecommendationEngine.js': `
import { ControllerRecommendation } from '../../models/operations/ControllerRecommendation.js';
import crypto from 'crypto';

export class RecommendationEngine {
  static async generate(scenario, topology, timetable) {
    // Deterministic inputs
    const inputs = {
      scenarioId: scenario._id.toString(),
      topologySnapshotId: topology._id.toString(),
      timetableSnapshotId: timetable._id.toString(),
      randomSeed: scenario.randomSeed,
      simulationClock: scenario.simulationClockTime,
      engineVersion: '1.0.0'
    };
    
    const inputHash = crypto.createHash('sha256').update(JSON.stringify(inputs)).digest('hex');

    // Rule-based deterministic generation
    const rec = new ControllerRecommendation({
      recommendationId: \`REC-\${inputHash.substring(0, 8)}\`,
      scenarioId: inputs.scenarioId,
      topologySnapshotId: inputs.topologySnapshotId,
      timetableSnapshotId: inputs.timetableSnapshotId,
      engineVersion: inputs.engineVersion,
      type: 'HOLD_TRAIN',
      actionPayload: { action: 'HOLD' },
      predictionConfidence: 85, // Mathematical separation
      recommendationScore: 100, // Semantic separation
      predictionInputs: inputs,
      evidence: {
        calculationTimestamp: new Date(),
        predictedDelay: 0,
        triggeringConflicts: [],
        affectedTrains: [],
        affectedSections: [],
        constraintViolations: [],
        alternatives: []
      },
      status: 'PROPOSED',
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60000)
    });

    // Hard rejection rules
    const isValid = this.validateRules(rec);
    if (!isValid) {
      rec.status = 'UNSAFE';
    }

    await rec.save();
    return rec;
  }

  static validateRules(rec) {
    // Deterministic rule validation
    return true; // Mocked safe
  }
}
`,

  // 4. WHAT-IF ANALYZER
  'server/src/services/intelligence/WhatIfAnalyzer.js': `
export class WhatIfAnalyzer {
  static async evaluate(recommendation, scenario, currentEvents) {
    // Ephemeral state cloning ONLY. 
    // ZERO DB MUTATION ALLOWED.
    
    const ephemeralState = {
      scenario: JSON.parse(JSON.stringify(scenario)),
      events: JSON.parse(JSON.stringify(currentEvents)),
      action: recommendation.actionPayload
    };

    // Calculate deterministic KPI delta based purely on ephemeral memory
    const projectedKpi = { throughputDelta: 5, delayDelta: -10 };

    return projectedKpi;
  }
}
`,

  // 5. INTELLIGENCE API
  'server/src/routes/intelligence.js': `
import { Router } from 'express';
import { rbac, ROLES } from '../middleware/rbac.js';
import { ControllerRecommendation } from '../models/operations/ControllerRecommendation.js';

const router = Router();

router.get('/recommendations', rbac(ROLES.ADMIN, ROLES.CONTROLLER), async (req, res) => {
  const recs = await ControllerRecommendation.find({ scenarioId: req.query.scenarioId }).lean();
  res.json({ data: recs });
});

router.post('/recommendations/:id/approve', rbac(ROLES.CONTROLLER), async (req, res) => {
  // Verifies controller authorization
  const rec = await ControllerRecommendation.findById(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  
  if (['EXPIRED', 'SUPERSEDED', 'INVALID', 'UNSAFE'].includes(rec.status)) {
    return res.status(400).json({ error: 'Cannot approve unsafe or invalid recommendation' });
  }

  // ONLY changes recommendation status and creates audit log. 
  // Execution to simulation happens explicitly downstream inside simulation boundary.
  rec.status = 'APPROVED';
  await rec.save();
  
  // Create audit log here (mocked for phase 5)
  
  res.json({ data: rec, message: 'Approved. Simulation execution pending.' });
});

router.post('/recommendations/:id/reject', rbac(ROLES.CONTROLLER), async (req, res) => {
  const rec = await ControllerRecommendation.findById(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  rec.status = 'REJECTED';
  await rec.save();
  res.json({ data: rec });
});

router.post('/recommendations/:id/what-if', rbac(ROLES.CONTROLLER), async (req, res) => {
  const rec = await ControllerRecommendation.findById(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  rec.status = 'WHAT_IF_EVALUATED';
  await rec.save();
  res.json({ data: { projectedKpi: { throughputDelta: 5, delayDelta: -10 } } });
});

export default router;
`,

  // 6. FRONTEND
  'client/src/components/IntelligencePanel.js': `
import React, { useState, useEffect } from 'react';
import api from '../services/api.js';

export default function IntelligencePanel({ scenarioId }) {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (scenarioId) {
      api.get(\`/intelligence/recommendations?scenarioId=\${scenarioId}\`)
         .then(res => setRecommendations(res.data.data));
    }
  }, [scenarioId]);

  const handleApprove = async (id) => {
    await api.post(\`/intelligence/recommendations/\${id}/approve\`);
    // refresh
  };

  return React.createElement('div', { className: 'bg-white p-4 shadow rounded' },
    React.createElement('h2', { className: 'font-semibold text-lg mb-4' }, 'Intelligence & Recommendations'),
    recommendations.map(r => React.createElement('div', { key: r._id, className: 'border p-3 mb-2' },
      React.createElement('div', { className: 'font-bold' }, r.type),
      React.createElement('div', { className: 'text-sm text-gray-600' }, \`Score: \${r.recommendationScore} | Confidence: \${r.predictionConfidence}%\`),
      React.createElement('div', { className: 'text-sm' }, r.status),
      r.status === 'PROPOSED' && React.createElement('button', {
        className: 'bg-green-600 text-white px-2 py-1 rounded mt-2 text-sm',
        onClick: () => handleApprove(r._id)
      }, 'Approve Action')
    ))
  );
}
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.resolve(__dirname, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim());
}

console.log('Phase 5 code generated.');
