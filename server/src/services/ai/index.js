const cohereProvider = require('./cohere');
const groqProvider = require('./groq');
const zaiProvider = require('./zai');
const promptBuilder = require('../promptBuilder');
const { normalizeAnalytics } = require('../interviewStrategy');
const AppError = require('../../utils/AppError');

const PROVIDERS = { cohere: cohereProvider, groq: groqProvider, zai: zaiProvider };
const DEFAULT_PRIORITY = ['cohere', 'groq', 'zai'];
let priority = [...DEFAULT_PRIORITY];
const providerState = new Map();

const numberSetting = (name, fallback) => {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};
const log = (...args) => { if (process.env.NODE_ENV !== 'production') console.log('[AI]', ...args); };
const operationTimeout = () => numberSetting('AI_OPERATION_TIMEOUT_MS', 30000);
const requestTimeout = () => numberSetting('AI_REQUEST_TIMEOUT', 12000);
const circuitCooldown = () => numberSetting('AI_CIRCUIT_COOLDOWN_MS', 15000);
const providerLimit = (name) => numberSetting(`AI_${name.toUpperCase()}_CONCURRENCY`, 4);

function stateFor(name) {
  if (!providerState.has(name)) providerState.set(name, { active: 0, failures: 0, openUntil: 0 });
  return providerState.get(name);
}
function remaining(deadline) { return Math.max(0, deadline - Date.now()); }
function operationExpired(deadline) { return remaining(deadline) <= 0; }
function timeoutError() { const error = new Error('AI operation deadline exceeded'); error.code = 'AI_OPERATION_TIMEOUT'; return error; }
function saturatedError(name) { const error = new Error(`${name} concurrency limit reached`); error.code = 'AI_PROVIDER_SATURATED'; return error; }

function moveToFront(name) {
  priority = [name, ...priority.filter((provider) => provider !== name)];
}
function moveToBack(name) {
  priority = [...priority.filter((provider) => provider !== name), name];
}
function canUseProvider(name) {
  const state = stateFor(name);
  if (state.openUntil > Date.now()) return false;
  if (state.openUntil) {
    state.openUntil = 0;
    state.failures = 0;
    log(`${name} recovered and is eligible again`);
  }
  return true;
}
function recordSuccess(name) {
  const state = stateFor(name);
  state.failures = 0;
  state.openUntil = 0;
  moveToFront(name);
  log(`${name} is current primary`);
}
function recordFailure(name, error) {
  const state = stateFor(name);
  state.failures += 1;
  state.openUntil = Date.now() + circuitCooldown();
  moveToBack(name);
  log(`${name} failed and was locked for ${circuitCooldown()}ms; priority is now ${priority.join(' -> ')}`, error?.message || 'unknown error');
}
function liveAiUnavailable(error) {
  const reason = error?.message ? ` Diagnostic: ${error.message}` : '';
  log('operation failed:', error?.message || 'deadline reached');
  const message = process.env.NODE_ENV === 'development'
    ? `Live AI is unavailable. Check your internet connection and AI provider configuration, then try again.${reason}`
    : 'Live AI is unavailable. Please try again later.';
  return new AppError(message, 503);
}

function releaseSlot(name) { stateFor(name).active = Math.max(0, stateFor(name).active - 1); }
function acquireSlot(name) {
  const state = stateFor(name);
  if (state.active >= providerLimit(name)) throw saturatedError(name);
  state.active += 1;
}
async function awaitAttempt(promise, timeoutMs) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error('AI provider attempt timed out');
          error.status = 408;
          error.code = 'AI_PROVIDER_TIMEOUT';
          reject(error);
        }, timeoutMs);
      }),
    ]);
  } finally { clearTimeout(timer); }
}

async function invokeProvider(name, method, params, deadline) {
  const provider = PROVIDERS[name];
  if (!provider) throw new AppError(`Unknown AI provider: ${name}`, 500);
  const effectiveTimeout = Math.min(requestTimeout(), remaining(deadline));
  if (effectiveTimeout <= 0) throw timeoutError();
  acquireSlot(name);
  try {
    log(`provider selected: ${name} (${effectiveTimeout}ms budget)`);
    return await awaitAttempt(provider[method]({ ...params, _timeoutMs: effectiveTimeout }), effectiveTimeout);
  } finally { releaseSlot(name); }
}

function validateTurn(type, data, isFinal) {
  if (!data || typeof data.betterAnswer !== 'string' || !data.updatedSummary || typeof data.updatedSummary !== 'string') throw new Error('Missing AI turn fields');
  if (data.updatedSummary.split(/\s+/).length > 180) data.updatedSummary = data.updatedSummary.split(/\s+/).slice(0, 150).join(' ');
  data.analytics = normalizeAnalytics(type, data.analytics);
  if (typeof data.nextQuestion === 'string') data.nextQuestion = { content: data.nextQuestion, difficulty: data.nextDifficulty || data.difficulty || 'MEDIUM' };
  else if (data.nextQuestion && !data.nextQuestion.content && typeof data.nextQuestion.question === 'string') data.nextQuestion.content = data.nextQuestion.question;
  if (data.nextQuestion?.difficulty) data.nextQuestion.difficulty = String(data.nextQuestion.difficulty).toUpperCase();
  if (isFinal) data.nextQuestion = null;
  if (!isFinal && (!data.nextQuestion || typeof data.nextQuestion.content !== 'string' || !['EASY', 'MEDIUM', 'HARD'].includes(data.nextQuestion.difficulty))) throw new Error('Invalid next question');
  return data;
}

// One provider receives one immediate attempt. Any failed response—including
// malformed data or configuration errors—locks and demotes that provider, then
// the next currently healthy provider is selected without retry/backoff.
async function execute(method, params, validate) {
  const deadline = Date.now() + operationTimeout();
  const attempted = new Set();
  let lastError;
  while (!operationExpired(deadline)) {
    const providerName = priority.find((name) => !attempted.has(name) && canUseProvider(name));
    if (!providerName) break;
    attempted.add(providerName);
    try {
      const result = await invokeProvider(providerName, method, params, deadline);
      const validated = validate ? validate(result) : result;
      recordSuccess(providerName);
      return validated;
    } catch (error) {
      lastError = error;
      // Saturation is local scheduling pressure, not a provider health failure.
      // Skip it for this operation and immediately try another provider.
      if (error?.code === 'AI_PROVIDER_SATURATED') {
        log(`${providerName} is saturated; trying another provider`);
      } else {
        recordFailure(providerName, error);
      }
    }
  }
  throw liveAiUnavailable(lastError || timeoutError());
}

async function generateInterviewTurn(params) {
  return execute('generateInterviewTurn', params, (result) => validateTurn(params.interviewType, result, params.questionNumber >= params.questionLimit));
}
async function generateFirstQuestion(params) { return execute('generateFirstQuestion', params); }
function resetProviderStateForTests() { priority = [...DEFAULT_PRIORITY]; providerState.clear(); }
function getProviderPriorityForTests() { return [...priority]; }

module.exports = {
  generateInterviewTurn,
  generateFirstQuestion,
  generateStructuredResponse: (prompts) => execute('generateStructuredResponse', prompts),
  buildResumeSummaryPrompt: promptBuilder.buildResumeSummaryPrompt,
  __resetProviderStateForTests: resetProviderStateForTests,
  __getProviderPriorityForTests: getProviderPriorityForTests,
};
