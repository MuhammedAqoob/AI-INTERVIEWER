const { CohereClientV2 } = require('cohere-ai');
const promptBuilder = require('../promptBuilder');

const MODEL_NAME = process.env.COHERE_MODEL || 'command-a-plus-05-2026';
const TIMEOUT_MS = parseInt(process.env.AI_REQUEST_TIMEOUT, 10) || 12000;

let client = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      throw new Error('COHERE_API_KEY is not set');
    }
    client = new CohereClientV2({ token: apiKey });
  }
  return client;
}

function extractJsonFromResponse(text) {
  let cleaned = String(text || '').trim();

  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    cleaned = jsonBlockMatch[1].trim();
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function effectiveTimeoutMs(params) {
  const requested = Number(params?._timeoutMs);
  if (Number.isFinite(requested) && requested > 0) {
    return Math.min(TIMEOUT_MS, requested);
  }
  return TIMEOUT_MS;
}

function attachStatus(error, status) {
  if (status) {
    error.status = status;
    error.statusCode = status;
  }
  return error;
}

async function callCohere(systemPrompt, userPrompt, timeoutMs, { jsonMode }) {
  const cohere = getClient();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await cohere.chat(
      {
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        maxTokens: 2048,
        ...(jsonMode ? { responseFormat: { type: 'json_object' } } : {}),
      },
      { signal: controller.signal },
    );

    const text = response?.message?.content
      ?.map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('') || '';

    return text;
  } catch (error) {
    // Cohere SDK throws a `CohereError` with a `statusCode` for non-2xx
    // responses. Normalize so the common execution policy in
    // `../ai/index.js` can route on `error.status` like the other providers.
    const status = error?.statusCode ?? error?.status ?? error?.response?.status;
    if (error?.name === 'CohereTimeoutError' || error?.code === 'ABORT_ERR') {
      throw attachStatus(new Error(`Cohere request aborted: ${error.message}`), 408);
    }
    throw attachStatus(new Error(`Cohere request failed (${status || 'unknown'}): ${error?.message || 'unknown error'}`), status);
  } finally {
    clearTimeout(timeout);
  }
}

async function generateInterviewTurn(params) {
  const prompts = promptBuilder.buildInterviewTurnPrompt({ ...params });
  const timeoutMs = effectiveTimeoutMs(params);
  const raw = await callCohere(prompts.systemPrompt, prompts.userPrompt, timeoutMs, { jsonMode: true });
  const jsonStr = extractJsonFromResponse(raw);
  const parsed = JSON.parse(jsonStr);
  return normalizeInterviewResponse(parsed);
}

async function generateFirstQuestion({ branch, interviewType, difficulty, resumeSummary, _timeoutMs }) {
  const prompts = promptBuilder.buildFirstQuestionPrompt({
    branch,
    interviewType,
    difficulty,
    resumeSummary,
  });
  const timeoutMs = effectiveTimeoutMs({ _timeoutMs });
  const raw = await callCohere(prompts.systemPrompt, prompts.userPrompt, timeoutMs, { jsonMode: true });
  const jsonStr = extractJsonFromResponse(raw);
  const parsed = JSON.parse(jsonStr);

  return {
    content: parsed.question || parsed.content || 'Can you tell me about yourself?',
    difficulty: parsed.difficulty || difficulty,
  };
}

async function generateStructuredResponse({ systemPrompt, userPrompt, _timeoutMs }) {
  const timeoutMs = effectiveTimeoutMs({ _timeoutMs });
  const raw = await callCohere(systemPrompt, userPrompt, timeoutMs, { jsonMode: true });
  const jsonStr = extractJsonFromResponse(raw);
  return JSON.parse(jsonStr);
}

function normalizeInterviewResponse(data) { return data; }

module.exports = {
  generateInterviewTurn,
  generateFirstQuestion,
  generateStructuredResponse,
};
