const { INTERVIEW_TYPES } = require('../constants/interviewTypes');

const TECHNICAL_METRICS = ['technology', 'problemSolving', 'criticalThinking'];
const HR_METRICS = ['communication', 'leadership', 'professionalism', 'confidence'];
const APTITUDE_METRICS = ['logicalReasoning', 'accuracy', 'speed'];
const CORE_TYPES = [INTERVIEW_TYPES.TECHNICAL, INTERVIEW_TYPES.HR, INTERVIEW_TYPES.APTITUDE];
const CORE_METRICS = [...TECHNICAL_METRICS, ...HR_METRICS, ...APTITUDE_METRICS];

const STRATEGIES = {
  [INTERVIEW_TYPES.TECHNICAL]: { analytics: TECHNICAL_METRICS },
  [INTERVIEW_TYPES.HR]: { analytics: HR_METRICS },
  [INTERVIEW_TYPES.APTITUDE]: { analytics: APTITUDE_METRICS },
  // Resume is optional. It uses only the established core metrics so it can
  // strengthen demonstrated skills without introducing a separate score type.
  [INTERVIEW_TYPES.RESUME]: { analytics: CORE_METRICS },
};

function getStrategy(type) {
  const strategy = STRATEGIES[type];
  if (!strategy) throw new Error(`Unsupported interview type: ${type}`);
  return strategy;
}

function normalizeAnalytics(type, raw) {
  const result = {};
  for (const key of getStrategy(type).analytics) {
    const value = Number(raw?.[key]);
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`Invalid analytics value: ${key}`);
    result[key] = Math.round(value);
  }
  return result;
}

module.exports = { getStrategy, normalizeAnalytics, STRATEGIES, CORE_TYPES, CORE_METRICS };
