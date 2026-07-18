const mockProvider = require('./mock');
const geminiProvider = require('./gemini');
const groqProvider = require('./groq');
const promptBuilder = require('../promptBuilder');
const AppError = require('../../utils/AppError');

const PROVIDERS = {
  mock: mockProvider,
  gemini: geminiProvider,
  groq: groqProvider,
};

const FALLBACK_PROVIDER = 'groq';
const MAX_RETRIES = 1;

function getPrimaryProviderName() {
  return process.env.AI_PROVIDER || 'mock';
}

function getProvider(name) {
  const provider = PROVIDERS[name];
  if (!provider) {
    throw new AppError(`Unknown AI provider: ${name}. Available: ${Object.keys(PROVIDERS).join(', ')}`, 500);
  }
  return provider;
}

function isRetryableError(error) {
  if (!error) return false;
  const msg = error.message || '';
  return (
    msg.includes('timeout') ||
    msg.includes('TIMEOUT') ||
    msg.includes('429') ||
    msg.includes('rate') ||
    msg.includes('Rate') ||
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('network') ||
    error.code === 'ECONNRESET' ||
    error.code === 'ENOTFOUND' ||
    error.status === 429 ||
    error.status === 500 ||
    error.status === 502 ||
    error.status === 503
  );
}

function isJsonParseError(error) {
  return error instanceof SyntaxError && error.message.includes('JSON');
}

function validateInterviewResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new AppError('AI returned empty or invalid response.', 502);
  }

  if (!data.evaluation || typeof data.evaluation !== 'object') {
    throw new AppError('AI response missing required field: evaluation.', 502);
  }

  if (typeof data.evaluation.score !== 'number') {
    throw new AppError('AI response missing evaluation.score.', 502);
  }

  if (!data.nextQuestion && data.shouldEnd !== true) {
    throw new AppError('AI response missing nextQuestion.', 502);
  }

  return true;
}

async function callWithRetry(providerName, method, params) {
  const provider = getProvider(providerName);
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await provider[method](params);
      return result;
    } catch (error) {
      lastError = error;

      if (isJsonParseError(error)) {
        if (attempt < MAX_RETRIES) {
          continue;
        }
      }

      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

async function callWithFallback(method, params) {
  const primaryName = getPrimaryProviderName();
  const fallbackName = FALLBACK_PROVIDER;

  try {
    const result = await callWithRetry(primaryName, method, params);
    return result;
  } catch (primaryError) {
    if (primaryName === fallbackName) {
      throw primaryError;
    }

    if (!process.env.AI_FALLBACK_ENABLED || process.env.AI_FALLBACK_ENABLED === 'false') {
      throw primaryError;
    }

    try {
      const fallbackResult = await callWithRetry(fallbackName, method, params);
      return fallbackResult;
    } catch (fallbackError) {
      throw primaryError;
    }
  }
}

async function generateInterviewTurn(params) {
  const result = await callWithFallback('generateInterviewTurn', params);

  validateInterviewResponse(result);

  return {
    evaluation: {
      score: clampScore(result.evaluation.score),
      feedback: String(result.evaluation.feedback || ''),
      betterAnswer: result.evaluation.betterAnswer || null,
      explanation: result.evaluation.explanation || null,
    },
    analytics: normalizeAnalytics(result.analytics),
    nextQuestion: result.nextQuestion
      ? {
          content: String(result.nextQuestion.content || ''),
          difficulty: result.nextQuestion.difficulty || 'MEDIUM',
        }
      : null,
    shouldHire: Boolean(result.shouldHire),
    hireReason: String(result.hireReason || ''),
    improvements: Array.isArray(result.improvements) ? result.improvements.map(String) : [],
    shouldEnd: Boolean(result.shouldEnd),
  };
}

async function generateFirstQuestion(params) {
  const providerName = getPrimaryProviderName();

  try {
    const result = await callWithFallback('generateFirstQuestion', params);
    return {
      content: String(result.content || result.question || 'Can you tell me about yourself?'),
      difficulty: result.difficulty || params.difficulty || 'EASY',
    };
  } catch (error) {
    if (providerName !== 'mock') {
      return getProvider('mock').generateFirstQuestion(params);
    }
    throw error;
  }
}

async function generateStructuredResponse(prompts) {
  const result = await callWithFallback('generateStructuredResponse', prompts);
  return result;
}

function buildResumeSummaryPrompt(params) {
  return promptBuilder.buildResumeSummaryPrompt(params);
}

function normalizeAnalytics(raw) {
  const defaults = {
    technicalKnowledge: 50,
    communication: 50,
    problemSolving: 50,
    confidence: 50,
    grammar: 50,
    leadership: 50,
    teamwork: 50,
    relevance: 50,
    professionalism: 50,
  };

  if (!raw || typeof raw !== 'object') return defaults;

  const result = {};
  for (const [key, defaultVal] of Object.entries(defaults)) {
    const num = Number(raw[key]);
    result[key] = isNaN(num) ? defaultVal : Math.max(0, Math.min(100, Math.round(num)));
  }
  return result;
}

function clampScore(value) {
  const num = Number(value);
  if (isNaN(num)) return 5;
  return Math.max(1, Math.min(10, Math.round(num)));
}

module.exports = {
  generateInterviewTurn,
  generateFirstQuestion,
  generateStructuredResponse,
  buildResumeSummaryPrompt,
};
