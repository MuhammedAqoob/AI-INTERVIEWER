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

async function callGroq(systemPrompt, userPrompt) {
  const groq = getClient();

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Groq request timeout')), TIMEOUT_MS);
  });

  const apiPromise = groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    model: MODEL_NAME,
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 0.9,
  });

  const result = await Promise.race([apiPromise, timeoutPromise]);
  const text = result.choices[0]?.message?.content || '';

  return text;
}

async function generateInterviewTurn({ branch, interviewType, conversationHistory, difficulty, resumeSummary }) {
  const prompts = promptBuilder.buildInterviewTurnPrompt({
    branch,
    interviewType,
    conversationHistory,
    difficulty,
    resumeSummary,
  });

  const raw = await callGroq(prompts.systemPrompt, prompts.userPrompt);
  const jsonStr = extractJsonFromResponse(raw);
  const parsed = JSON.parse(jsonStr);

  return normalizeInterviewResponse(parsed);
}

async function generateFirstQuestion({ branch, interviewType, difficulty, resumeSummary }) {
  const prompts = promptBuilder.buildFirstQuestionPrompt({
    branch,
    interviewType,
    difficulty,
    resumeSummary,
  });

  const raw = await callGroq(prompts.systemPrompt, prompts.userPrompt);
  const jsonStr = extractJsonFromResponse(raw);
  const parsed = JSON.parse(jsonStr);

  return {
    content: parsed.question || parsed.content || 'Can you tell me about yourself?',
    difficulty: parsed.difficulty || difficulty,
  };
}

async function generateStructuredResponse({ systemPrompt, userPrompt }) {
  const raw = await callGroq(systemPrompt, userPrompt);
  const jsonStr = extractJsonFromResponse(raw);
  return JSON.parse(jsonStr);
}

function normalizeInterviewResponse(data) {
  return {
    evaluation: {
      score: clampScore(data.evaluation?.score, 5),
      feedback: data.evaluation?.feedback || 'No feedback provided.',
      betterAnswer: data.evaluation?.betterAnswer || null,
      explanation: data.evaluation?.explanation || null,
    },
    analytics: normalizeAnalytics(data.analytics),
    nextQuestion: data.nextQuestion
      ? {
          content: data.nextQuestion.content || data.nextQuestion,
          difficulty: data.nextQuestion.difficulty || 'MEDIUM',
        }
      : null,
    shouldHire: data.shouldHire || false,
    hireReason: data.hireReason || '',
    improvements: Array.isArray(data.improvements) ? data.improvements : [],
    shouldEnd: data.shouldEnd || false,
  };
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
    result[key] = clampAnalytics(raw[key], defaultVal);
  }
  return result;
}

function clampScore(value, fallback) {
  const num = Number(value);
  if (isNaN(num)) return fallback;
  return Math.max(1, Math.min(10, Math.round(num)));
}

function clampAnalytics(value, fallback) {
  const num = Number(value);
  if (isNaN(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

module.exports = {
  generateInterviewTurn,
  generateFirstQuestion,
  generateStructuredResponse,
};
