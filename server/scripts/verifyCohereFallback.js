// Forces Groq to fail so the orchestrator must fall through to the next
// available provider. Expects either Cohere or Z.AI to succeed.
require('dotenv').config();
process.env.AI_OPERATION_TIMEOUT_MS = '20000';
process.env.AI_RETRY_COUNT = '0';

const ai = require('../src/services/ai');
const groq = require('../src/services/ai/groq');
const cohere = require('../src/services/ai/cohere');

const originalGroq = groq.generateStructuredResponse;
groq.generateStructuredResponse = async () => {
  const error = new Error('forced groq failure');
  error.status = 503;
  throw error;
};

console.log('--- Targeted fallback test ---');
console.log('Forcing ONLY groq to fail...\n');

(async () => {
  const start = Date.now();
  try {
    const result = await ai.generateStructuredResponse({
      systemPrompt: 'Return only valid JSON.',
      userPrompt: 'Return {"provider":"worked"}',
    });
    const ms = Date.now() - start;
    console.log(`[OK] orchestrator succeeded in ${ms}ms after groq failure`);
    console.log('Result:', JSON.stringify(result));
  } catch (error) {
    const ms = Date.now() - start;
    console.log(`[FAIL] orchestrator failed in ${ms}ms: ${error.message}`);
    process.exit(1);
  } finally {
    groq.generateStructuredResponse = originalGroq;
  }
})();
