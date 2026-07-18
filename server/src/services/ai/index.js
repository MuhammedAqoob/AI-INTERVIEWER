const mockProvider = require('./mock');

const providers = {
  mock: mockProvider,
};

function getProvider() {
  const providerName = process.env.AI_PROVIDER || 'mock';
  const provider = providers[providerName];
  if (!provider) {
    throw new Error(`Unknown AI provider: ${providerName}`);
  }
  return provider;
}

function generateInterviewTurn(params) {
  return getProvider().generateInterviewTurn(params);
}

module.exports = { generateInterviewTurn };
