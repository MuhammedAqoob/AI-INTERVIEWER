const promptBuilder = require('../promptBuilder');

const API_URL = 'https://api.z.ai/api/paas/v4/chat/completions';
const MODEL_NAME = process.env.ZAI_MODEL || 'glm-4.7-flash';
const TIMEOUT_MS = parseInt(process.env.AI_REQUEST_TIMEOUT, 10) || 15000;

function extractJsonFromResponse(text) {
  const cleaned = String(text || '').trim().replace(/^```json\s*|\s*```$/g, '');
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  return first >= 0 && last > first ? cleaned.slice(first, last + 1) : cleaned;
}

async function callZai(systemPrompt, userPrompt, timeoutMs = TIMEOUT_MS) {
  if (!process.env.ZAI_API_KEY) throw new Error('ZAI_API_KEY is not set');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${process.env.ZAI_API_KEY}`, 'Content-Type': 'application/json', 'Accept-Language': 'en-US,en' },
      body: JSON.stringify({ model: MODEL_NAME, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], temperature: 0.7, max_tokens: 2048, stream: false, thinking: { type: 'disabled' }, response_format: { type: 'json_object' } }),
    });
    const body = await response.json();
    if (!response.ok) {
      // Preserve the provider status so the common execution policy can tell
      // a retryable 429/5xx from a permanent credentials/request failure.
      const error = new Error(`Z.AI request failed (${response.status}): ${body?.message || body?.error?.message || 'Unknown error'}`);
      error.status = response.status;
      throw error;
    }
    return body.choices?.[0]?.message?.content || '';
  } finally { clearTimeout(timeout); }
}

async function generateInterviewTurn(params) {
  const prompts = promptBuilder.buildInterviewTurnPrompt(params);
  return JSON.parse(extractJsonFromResponse(await callZai(prompts.systemPrompt, prompts.userPrompt, params._timeoutMs)));
}

async function generateFirstQuestion(params) {
  const prompts = promptBuilder.buildFirstQuestionPrompt(params);
  const parsed = JSON.parse(extractJsonFromResponse(await callZai(prompts.systemPrompt, prompts.userPrompt, params._timeoutMs)));
  return { content: parsed.question || parsed.content || 'Can you tell me about yourself?', difficulty: parsed.difficulty || params.difficulty || 'EASY' };
}

async function generateStructuredResponse({ systemPrompt, userPrompt, _timeoutMs }) {
  return JSON.parse(extractJsonFromResponse(await callZai(systemPrompt, userPrompt, _timeoutMs)));
}

module.exports = { generateInterviewTurn, generateFirstQuestion, generateStructuredResponse };
