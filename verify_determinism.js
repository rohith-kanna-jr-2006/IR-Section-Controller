import { RecommendationEngine } from './server/src/services/intelligence/RecommendationEngine.js';
import { WhatIfAnalyzer } from './server/src/services/intelligence/WhatIfAnalyzer.js';
import mongoose from 'mongoose';

async function run() {
  // Mock mongoose save
  mongoose.Model.prototype.save = async function() { return this; };

  const scenario = { _id: 'scenario1', randomSeed: 12345, simulationClockTime: 1000 };
  const topology = { _id: 'topo1' };
  const timetable = { _id: 'time1' };

  const rec1 = await RecommendationEngine.generate(scenario, topology, timetable);
  const rec2 = await RecommendationEngine.generate(scenario, topology, timetable);
  const rec3 = await RecommendationEngine.generate(scenario, topology, timetable);

  if (rec1.recommendationId === rec2.recommendationId && rec2.recommendationId === rec3.recommendationId) {
    console.log('Determinism VERIFIED');
  } else {
    console.log('Determinism FAILED');
  }

  const beforeScenarioStr = JSON.stringify(scenario);
  const currentEvents = [];
  await WhatIfAnalyzer.evaluate(rec1, scenario, currentEvents);
  const afterScenarioStr = JSON.stringify(scenario);

  if (beforeScenarioStr === afterScenarioStr) {
    console.log('What-If Immutability VERIFIED');
  } else {
    console.log('What-If Immutability FAILED');
  }
}

run();
