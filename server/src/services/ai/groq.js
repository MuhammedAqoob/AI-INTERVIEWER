const Groq = require('groq-sdk');
const promptBuilder = require('../promptBuilder');

const MODEL_NAME = 'llama-3.3-70b-versatile';
const TIMEOUT_MS = parseInt(process.env.AI_REQUEST_TIMEOUT, 10) || 30000;

let client = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set');
    }
    client = new Groq({ apiKey });
  }
  return client;
}

function extractJsonFromResponse(text) {
  let cleaned = text.trim();

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

async function callGroq(systemPrompt, userPrompt, timeoutMs = TIMEOUT_MS) {
  const groq = getClient();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let result;
  try {
    result = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: MODEL_NAME,
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9,
      response_format: { type: 'json_object' },
    }, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  const text = result.choices[0]?.message?.content || '';

  return text;
}

async function generateInterviewTurn(params) {
  const prompts = promptBuilder.buildInterviewTurnPrompt({
    ...params,
  });

  const raw = await callGroq(prompts.systemPrompt, prompts.userPrompt, params._timeoutMs);
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

  const raw = await callGroq(prompts.systemPrompt, prompts.userPrompt, _timeoutMs);
  const jsonStr = extractJsonFromResponse(raw);
  const parsed = JSON.parse(jsonStr);

  return {
    content: parsed.question || parsed.content || 'Can you tell me about yourself?',
    difficulty: parsed.difficulty || difficulty,
  };
}

async function generateStructuredResponse({ systemPrompt, userPrompt, _timeoutMs }) {
  const raw = await callGroq(systemPrompt, userPrompt, _timeoutMs);
  const jsonStr = extractJsonFromResponse(raw);
  return JSON.parse(jsonStr);
}

function normalizeInterviewResponse(data) { return data; }

module.exports = {
  generateInterviewTurn,
  generateFirstQuestion,
  generateStructuredResponse,
};
