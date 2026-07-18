const mockProvider = require('./mock');
const promptBuilder = require('../promptBuilder');

const providers = {
  mock: mockProvider,
};

function getProvider() {
  const providerName = process.env.AI_PROVIDER || 'mock';
  const provider = providers[providerName];
  if (!provider) {
    throw new Error(`Unknown AI provider: ${providerName}. Available: ${Object.keys(providers).join(', ')}`);
  }
  return provider;
}

async function generateInterviewTurn(params) {
  const provider = getProvider();
  return provider.generateInterviewTurn(params);
}

async function generateFirstQuestion(params) {
  const provider = getProvider();
  if (provider.generateFirstQuestion) {
    return provider.generateFirstQuestion(params);
  }

  const prompts = promptBuilder.buildFirstQuestionPrompt(params);
  const result = await provider.generateStructuredResponse(prompts);

  return {
    content: result.question,
    difficulty: result.difficulty || params.difficulty,
  };
}

async function generateStructuredResponse(prompts) {
  const provider = getProvider();
  if (provider.generateStructuredResponse) {
    return provider.generateStructuredResponse(prompts);
  }

  throw new Error(`Provider ${process.env.AI_PROVIDER || 'mock'} does not support generateStructuredResponse`);
}

function buildResumeSummaryPrompt(params) {
  return promptBuilder.buildResumeSummaryPrompt(params);
}

module.exports = {
  generateInterviewTurn,
  generateFirstQuestion,
  generateStructuredResponse,
  buildResumeSummaryPrompt,
};
