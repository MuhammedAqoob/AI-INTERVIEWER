// Quick verification script — exercises every provider in the chain via the
// orchestrator. Run with `node scripts/verifyCohere.js` from the server dir.
require('dotenv').config();

const ai = require('../src/services/ai');
const cohere = require('../src/services/ai/cohere');

const env = process.env;
const TIMEOUT_MS = parseInt(process.env.AI_REQUEST_TIMEOUT, 10) || 15000;

async function time(label, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    const ms = Date.now() - start;
    console.log(`[OK] ${label} (${ms}ms)`);
    console.log(JSON.stringify(result, null, 2));
    return { ok: true, result, ms };
  } catch (error) {
    const ms = Date.now() - start;
    console.log(`[FAIL] ${label} (${ms}ms): ${error.message}`);
    if (error.status || error.statusCode) console.log(`  status: ${error.status || error.statusCode}`);
    return { ok: false, error: error.message, ms };
  }
}

async function main() {
  process.env.AI_OPERATION_TIMEOUT_MS = '30000';
  process.env.AI_RETRY_COUNT = '0';

  console.log('--- AI provider check ---');
  console.log('COHERE_API_KEY set:', Boolean(process.env.COHERE_API_KEY));
  console.log('GROQ_API_KEY set:', Boolean(process.env.GROQ_API_KEY));
  console.log('ZAI_API_KEY set:', Boolean(process.env.ZAI_API_KEY));
  console.log('TIMEOUT_MS:', TIMEOUT_MS);
  console.log();

  console.log('--- 1. Direct Cohere provider call (generateStructuredResponse) ---');
  const direct = await time('cohere.generateStructuredResponse', () =>
    cohere.generateStructuredResponse({
      systemPrompt: 'You are a concise assistant. Return only valid JSON.',
      userPrompt: 'Say hello by returning JSON: {"greeting":"hello"}',
      _timeoutMs: TIMEOUT_MS,
    }),
  );

  if (!direct.ok) {
    console.log('Direct Cohere call failed — aborting before testing the orchestrator chain.');
    process.exit(1);
  }

  console.log('\n--- 2. Orchestrator — generateFirstQuestion (goes through entire fallback chain) ---');
  const first = await time('ai.generateFirstQuestion', () =>
    ai.generateFirstQuestion({
      branch: 'engineering',
      interviewType: 'RESUME',
      difficulty: 'EASY',
      resumeSummary: 'Sample candidate: 3 years of frontend experience with React and TypeScript.',
    }),
  );

  console.log('\n--- 3. Orchestrator — generateInterviewTurn (final question) ---');
  const turn = await time('ai.generateInterviewTurn', () =>
    ai.generateInterviewTurn({
      interviewType: 'RESUME',
      branch: 'engineering',
      questionNumber: 10,
      questionLimit: 10,
      difficulty: 'MEDIUM',
      rollingSummary: 'Candidate has shown strength in React state management.',
      currentQuestion: 'Describe state management.',
      candidateAnswer: 'React state is managed via useState for local component state, and Context API or libraries like Redux for shared state across components.',
    }),
  );

  console.log('\n--- Verification complete ---');
  console.log('direct ok:', direct.ok);
  console.log('first question ok:', first.ok);
  console.log('interview turn ok:', turn.ok);
  process.exit(direct.ok && first.ok && turn.ok ? 0 : 1);
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
