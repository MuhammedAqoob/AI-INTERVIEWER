const geminiProvider = require('./gemini');
const groqProvider = require('./groq');
const zaiProvider = require('./zai');
const promptBuilder = require('../promptBuilder');
const { normalizeAnalytics } = require('../interviewStrategy');
const AppError = require('../../utils/AppError');

const PROVIDERS = { gemini: geminiProvider, groq: groqProvider, zai: zaiProvider };
const providerState = new Map();

const numberSetting = (name, fallback) => {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};
const log = (...args) => { if (process.env.NODE_ENV !== 'production') console.log('[AI]', ...args); };
const primary = () => process.env.AI_PROVIDER || 'gemini';
const providerSequence = () => [...new Set([primary(), 'gemini', 'groq', 'zai'])];
const operationTimeout = () => numberSetting('AI_OPERATION_TIMEOUT_MS', 45000);
const retryCount = () => numberSetting('AI_RETRY_COUNT', 1);
const circuitThreshold = () => numberSetting('AI_CIRCUIT_FAILURE_THRESHOLD', 3);
const circuitCooldown = () => numberSetting('AI_CIRCUIT_COOLDOWN_MS', 15000);
const slotWait = () => numberSetting('AI_PROVIDER_SLOT_WAIT_MS', 1500);
const providerLimit = (name) => numberSetting(`AI_${name.toUpperCase()}_CONCURRENCY`, 4);

function stateFor(name) {
  if (!providerState.has(name)) providerState.set(name, { active: 0, failures: 0, openUntil: 0, waiters: [] });
  return providerState.get(name);
}
function operationExpired(deadline) { return Date.now() >= deadline; }
function remaining(deadline) { return Math.max(0, deadline - Date.now()); }
function timeoutError() { const error = new Error('AI operation deadline exceeded'); error.code = 'AI_OPERATION_TIMEOUT'; return error; }
async function awaitWithinDeadline(promise, deadline) {
  const ms = remaining(deadline);
  if (!ms) throw timeoutError();
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(timeoutError()), ms); }),
    ]);
  } finally { clearTimeout(timer); }
}

function errorStatus(error) {
  return Number(error?.status || error?.statusCode || error?.response?.status || error?.error?.status);
}
function isTransient(error) {
  const status = errorStatus(error);
  if ([408, 425, 429].includes(status) || (status >= 500 && status <= 599)) return true;
  const message = String(error?.message || '');
  return error?.name === 'AbortError' || error?.code === 'AI_OPERATION_TIMEOUT'
    || /timeout|timed out|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|network|socket|fetch failed|concurrency limit reached/i.test(message);
}
function isMalformedResponse(error) {
  return error instanceof SyntaxError || /JSON|Invalid next question|Missing AI turn fields|Invalid analytics/i.test(error?.message || '');
}
function isPermanent(error) { return !isTransient(error) && !isMalformedResponse(error); }

function liveAiUnavailable(error) {
  const reason = error?.message ? ` Diagnostic: ${error.message}` : '';
  log('operation failed:', error?.message || 'unknown error');
  const message = process.env.NODE_ENV === 'development'
    ? `Live AI is unavailable. Check your internet connection and AI provider configuration, then try again.${reason}`
    : 'Live AI is unavailable. Please try again later.';
  return new AppError(message, 503);
}
function aiResponseInvalid(error) {
  const reason = error?.message ? ` Diagnostic: ${error.message}` : '';
  log('malformed response:', error?.message || 'unknown error');
  const message = process.env.NODE_ENV === 'development'
    ? `Live AI returned malformed JSON. Please submit the answer again.${reason}`
    : 'Live AI returned an invalid response. Please submit the answer again.';
  return new AppError(message, 502);
}

function releaseSlot(name) {
  const state = stateFor(name);
  state.active = Math.max(0, state.active - 1);
  const next = state.waiters.shift();
  if (next) next();
}
async function acquireSlot(name, deadline) {
  const state = stateFor(name);
  if (state.active < providerLimit(name)) { state.active += 1; return; }
  log(`${name} concurrency saturated (${state.active}/${providerLimit(name)})`);
  const waitMs = Math.min(slotWait(), remaining(deadline));
  if (!waitMs) throw timeoutError();
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const index = state.waiters.indexOf(onSlot);
      if (index >= 0) state.waiters.splice(index, 1);
      reject(new Error(`${name} concurrency limit reached`));
    }, waitMs);
    const onSlot = () => { clearTimeout(timer); state.active += 1; resolve(); };
    state.waiters.push(onSlot);
  });
}
function canUseProvider(name) {
  const state = stateFor(name);
  if (state.openUntil > Date.now()) return false;
  if (state.openUntil) { state.openUntil = 0; log(`${name} circuit closed after cooldown`); }
  return true;
}
function recordSuccess(name) {
  const state = stateFor(name);
  state.failures = 0;
  state.openUntil = 0;
}
function recordFailure(name, error) {
  if (!isTransient(error)) return;
  const state = stateFor(name);
  state.failures += 1;
  if (state.failures >= circuitThreshold()) {
    state.openUntil = Date.now() + circuitCooldown();
    log(`${name} circuit opened for ${circuitCooldown()}ms after ${state.failures} transient failures`);
  }
}
async function sleepBackoff(attempt, deadline) {
  const base = numberSetting('AI_RETRY_BASE_DELAY_MS', 150);
  const max = numberSetting('AI_RETRY_MAX_DELAY_MS', 1000);
  const jitter = Math.floor(Math.random() * Math.max(1, base));
  const delay = Math.min(max, base * (2 ** attempt) + jitter, remaining(deadline));
  if (!delay) throw timeoutError();
  await new Promise((resolve) => setTimeout(resolve, delay));
}

async function invokeProvider(name, method, params, deadline) {
  const provider = PROVIDERS[name];
  if (!provider) throw new AppError(`Unknown AI provider: ${name}`, 500);
  if (!canUseProvider(name)) throw new Error(`${name} provider is cooling down`);
  await acquireSlot(name, deadline);
  try {
    if (operationExpired(deadline)) throw timeoutError();
    log(`provider selected: ${name}`);
    const result = await awaitWithinDeadline(provider[method]({ ...params, _timeoutMs: remaining(deadline) }), deadline);
    recordSuccess(name);
    return result;
  } catch (error) {
    recordFailure(name, error);
    throw error;
  } finally { releaseSlot(name); }
}

async function execute(method, params, validate) {
  const deadline = Date.now() + operationTimeout();
  let lastError;
  for (const providerName of providerSequence()) {
    if (operationExpired(deadline)) break;
    if (!canUseProvider(providerName)) { lastError = new Error(`${providerName} provider is cooling down`); continue; }
    for (let attempt = 0; attempt <= retryCount(); attempt += 1) {
      try {
        const result = await invokeProvider(providerName, method, params, deadline);
        return validate ? validate(result) : result;
      } catch (error) {
        lastError = error;
        if (isMalformedResponse(error) || isPermanent(error)) throw (isMalformedResponse(error) ? aiResponseInvalid(error) : liveAiUnavailable(error));
        if (attempt < retryCount() && !operationExpired(deadline)) {
          log(`${providerName} transient failure; retrying (${attempt + 1}/${retryCount()})`);
          await sleepBackoff(attempt, deadline);
        }
      }
    }
    if (isTransient(lastError)) log(`${providerName} unavailable; falling back`);
  }
  throw (isMalformedResponse(lastError) ? aiResponseInvalid(lastError) : liveAiUnavailable(lastError || timeoutError()));
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

async function generateInterviewTurn(params) { return execute('generateInterviewTurn', params, (result) => validateTurn(params.interviewType, result, params.questionNumber >= params.questionLimit)); }
async function generateFirstQuestion(params) { return execute('generateFirstQuestion', params); }
async function generateFinalEvaluation(params) {
  const result = await execute('generateStructuredResponse', promptBuilder.buildFinalEvaluationPrompt(params));
  if (!result || typeof result.overallSummary !== 'string' || !Array.isArray(result.strengths) || !Array.isArray(result.weaknesses)) throw new AppError('Invalid final evaluation response.', 502);
  return result;
}
function resetProviderStateForTests() { providerState.clear(); }

module.exports = { generateInterviewTurn, generateFirstQuestion, generateFinalEvaluation, generateStructuredResponse: (prompts) => execute('generateStructuredResponse', prompts), buildResumeSummaryPrompt: promptBuilder.buildResumeSummaryPrompt, __resetProviderStateForTests: resetProviderStateForTests, __isTransient: isTransient };
