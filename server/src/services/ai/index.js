const geminiProvider = require('./gemini');
const groqProvider = require('./groq');
const zaiProvider = require('./zai');
const promptBuilder = require('../promptBuilder');
const { normalizeAnalytics } = require('../interviewStrategy');
const AppError = require('../../utils/AppError');

const PROVIDERS = { gemini: geminiProvider, groq: groqProvider, zai: zaiProvider };
const retries = 1;
const primary = () => process.env.AI_PROVIDER || 'gemini';
const providerSequence = () => [...new Set([primary(), 'gemini', 'groq', 'zai'])];
function liveAiUnavailable(error) {
  const reason = error?.message ? ` Diagnostic: ${error.message}` : '';
  if (error) console.error('Live AI provider failure:', error.message);
  const message = process.env.NODE_ENV === 'development'
    ? `Live AI is unavailable. Check your internet connection and Gemini/Groq API configuration, then try again.${reason}`
    : 'Live AI is unavailable. Please try again later.';
  return new AppError(message, 503);
}

function aiResponseInvalid(error) {
  const reason = error?.message ? ` Diagnostic: ${error.message}` : '';
  if (error) console.error('Malformed AI response:', error.message);
  const message = process.env.NODE_ENV === 'development'
    ? `Live AI returned malformed JSON after retry. Please submit the answer again.${reason}`
    : 'Live AI returned an invalid response. Please submit the answer again.';
  return new AppError(message, 502);
}

function isMalformedResponse(error) {
  return error instanceof SyntaxError || /JSON|Invalid next question|Missing AI turn fields|Invalid analytics/i.test(error?.message || '');
}

async function call(name, method, params) {
  const provider = PROVIDERS[name];
  if (!provider) throw new AppError(`Unknown AI provider: ${name}`, 500);
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try { return await provider[method](params); } catch (error) { lastError = error; }
  }
  throw lastError;
}

async function withFallback(method, params) {
  let lastError;
  for (const providerName of providerSequence()) {
    try { return await call(providerName, method, params); }
    catch (error) { lastError = error; }
  }
  throw (isMalformedResponse(lastError) ? aiResponseInvalid(lastError) : liveAiUnavailable(lastError));
}

function validateTurn(type, data, isFinal) {
  if (!data || typeof data.betterAnswer !== 'string' || !data.updatedSummary || typeof data.updatedSummary !== 'string') throw new Error('Missing AI turn fields');
  if (data.updatedSummary.split(/\s+/).length > 180) data.updatedSummary = data.updatedSummary.split(/\s+/).slice(0, 150).join(' ');
  data.analytics = normalizeAnalytics(type, data.analytics);
  if (typeof data.nextQuestion === 'string') {
    data.nextQuestion = { content: data.nextQuestion, difficulty: data.nextDifficulty || data.difficulty || 'MEDIUM' };
  } else if (data.nextQuestion && !data.nextQuestion.content && typeof data.nextQuestion.question === 'string') {
    data.nextQuestion.content = data.nextQuestion.question;
  }
  if (data.nextQuestion?.difficulty) data.nextQuestion.difficulty = String(data.nextQuestion.difficulty).toUpperCase();
  if (isFinal) data.nextQuestion = null;
  if (!isFinal && (!data.nextQuestion || typeof data.nextQuestion.content !== 'string' || !['EASY', 'MEDIUM', 'HARD'].includes(data.nextQuestion.difficulty))) throw new Error('Invalid next question');
  return data;
}

async function callValidatedTurn(providerName, params) {
  const provider = PROVIDERS[providerName];
  if (!provider) throw new AppError(`Unknown AI provider: ${providerName}`, 500);
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const result = await provider.generateInterviewTurn(params);
      const validated = validateTurn(params.interviewType, result, params.questionNumber >= params.questionLimit);
      return validated;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function generateInterviewTurn(params) {
  let lastError;
  for (const providerName of providerSequence()) {
    try { return await callValidatedTurn(providerName, params); }
    catch (error) { lastError = error; }
  }
  throw (isMalformedResponse(lastError) ? aiResponseInvalid(lastError) : liveAiUnavailable(lastError));
}
async function generateFirstQuestion(params) { return withFallback('generateFirstQuestion', params); }
async function generateFinalEvaluation(params) {
  const result = await withFallback('generateStructuredResponse', promptBuilder.buildFinalEvaluationPrompt(params));
  if (!result || typeof result.overallSummary !== 'string' || !Array.isArray(result.strengths) || !Array.isArray(result.weaknesses)) throw new AppError('Invalid final evaluation response.', 502);
  return result;
}

module.exports = { generateInterviewTurn, generateFirstQuestion, generateFinalEvaluation, generateStructuredResponse: (prompts) => withFallback('generateStructuredResponse', prompts), buildResumeSummaryPrompt: promptBuilder.buildResumeSummaryPrompt };
