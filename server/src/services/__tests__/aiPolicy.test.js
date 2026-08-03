jest.mock('../ai/cohere', () => ({ generateStructuredResponse: jest.fn(), generateInterviewTurn: jest.fn(), generateFirstQuestion: jest.fn() }));
jest.mock('../ai/groq', () => ({ generateStructuredResponse: jest.fn(), generateInterviewTurn: jest.fn(), generateFirstQuestion: jest.fn() }));
jest.mock('../ai/zai', () => ({ generateStructuredResponse: jest.fn(), generateInterviewTurn: jest.fn(), generateFirstQuestion: jest.fn() }));

const cohere = require('../ai/cohere');
const groq = require('../ai/groq');
const zai = require('../ai/zai');
const ai = require('../ai');

const failed = (message = 'provider failure', status) => Object.assign(new Error(message), status ? { status } : {});

describe('dynamic AI provider priority', () => {
  const originalEnv = process.env;
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      AI_OPERATION_TIMEOUT_MS: '100',
      AI_REQUEST_TIMEOUT: '50',
      AI_RETRY_COUNT: '0',
      AI_CIRCUIT_COOLDOWN_MS: '1000',
      AI_COHERE_CONCURRENCY: '4',
      AI_GROQ_CONCURRENCY: '4',
      AI_ZAI_CONCURRENCY: '4',
    };
    ai.__resetProviderStateForTests();
    cohere.generateStructuredResponse.mockResolvedValue({ provider: 'cohere' });
    groq.generateStructuredResponse.mockResolvedValue({ provider: 'groq' });
    zai.generateStructuredResponse.mockResolvedValue({ provider: 'zai' });
  });
  afterAll(() => { process.env = originalEnv; });

  test('uses Cohere as the initial healthy primary only', async () => {
    await expect(ai.generateStructuredResponse({})).resolves.toEqual({ provider: 'cohere' });
    expect(cohere.generateStructuredResponse).toHaveBeenCalledTimes(1);
    expect(groq.generateStructuredResponse).not.toHaveBeenCalled();
    expect(zai.generateStructuredResponse).not.toHaveBeenCalled();
  });

  test('demotes a failed primary and promotes the successful fallback', async () => {
    cohere.generateStructuredResponse.mockRejectedValue(failed('Cohere unavailable', 503));
    await expect(ai.generateStructuredResponse({})).resolves.toEqual({ provider: 'groq' });
    expect(cohere.generateStructuredResponse).toHaveBeenCalledTimes(1);
    expect(groq.generateStructuredResponse).toHaveBeenCalledTimes(1);
    expect(ai.__getProviderPriorityForTests()).toEqual(['groq', 'zai', 'cohere']);
  });

  test('promotes Z.AI after Cohere and Groq fail', async () => {
    cohere.generateStructuredResponse.mockRejectedValue(failed('Cohere failure'));
    groq.generateStructuredResponse.mockRejectedValue(failed('Groq failure'));
    await expect(ai.generateStructuredResponse({})).resolves.toEqual({ provider: 'zai' });
    expect(ai.__getProviderPriorityForTests()).toEqual(['zai', 'cohere', 'groq']);
  });

  test.each([
    ['400', failed('bad request', 400)],
    ['401', failed('unauthorized', 401)],
    ['403', failed('forbidden', 403)],
    ['408', failed('timeout', 408)],
    ['429', failed('rate limited', 429)],
    ['500', failed('server error', 500)],
    ['network', failed('fetch failed')],
    ['SDK', failed('SDK error')],
    ['malformed JSON', new SyntaxError('Unexpected token')],
  ])('falls through after %s provider failure', async (_label, error) => {
    cohere.generateStructuredResponse.mockRejectedValue(error);
    await expect(ai.generateStructuredResponse({})).resolves.toEqual({ provider: 'groq' });
    expect(cohere.generateStructuredResponse).toHaveBeenCalledTimes(1);
    expect(groq.generateStructuredResponse).toHaveBeenCalledTimes(1);
  });

  test('calls each provider at most once per operation', async () => {
    cohere.generateStructuredResponse.mockRejectedValue(failed());
    groq.generateStructuredResponse.mockRejectedValue(failed());
    zai.generateStructuredResponse.mockRejectedValue(failed());
    await expect(ai.generateStructuredResponse({})).rejects.toMatchObject({ statusCode: 503 });
    expect(cohere.generateStructuredResponse).toHaveBeenCalledTimes(1);
    expect(groq.generateStructuredResponse).toHaveBeenCalledTimes(1);
    expect(zai.generateStructuredResponse).toHaveBeenCalledTimes(1);
  });

  test('skips a locked provider and uses the next healthy provider', async () => {
    cohere.generateStructuredResponse.mockRejectedValueOnce(failed());
    await ai.generateStructuredResponse({});
    jest.clearAllMocks();
    groq.generateStructuredResponse.mockResolvedValue({ provider: 'groq' });
    await expect(ai.generateStructuredResponse({})).resolves.toEqual({ provider: 'groq' });
    expect(cohere.generateStructuredResponse).not.toHaveBeenCalled();
  });

  test('allows a locked provider back after its cooldown', async () => {
    process.env.AI_CIRCUIT_COOLDOWN_MS = '1';
    cohere.generateStructuredResponse.mockRejectedValueOnce(failed());
    await ai.generateStructuredResponse({});
    await new Promise((resolve) => setTimeout(resolve, 5));
    jest.clearAllMocks();
    groq.generateStructuredResponse.mockRejectedValue(failed());
    zai.generateStructuredResponse.mockRejectedValue(failed());
    cohere.generateStructuredResponse.mockResolvedValue({ provider: 'cohere-recovered' });
    await expect(ai.generateStructuredResponse({})).resolves.toEqual({ provider: 'cohere-recovered' });
    expect(cohere.generateStructuredResponse).toHaveBeenCalledTimes(1);
  });

  test('passes min(per-provider timeout, remaining global budget) to each attempt', async () => {
    process.env.AI_OPERATION_TIMEOUT_MS = '30';
    process.env.AI_REQUEST_TIMEOUT = '12';
    const seen = [];
    cohere.generateStructuredResponse.mockImplementation((params) => { seen.push(params._timeoutMs); throw failed(); });
    groq.generateStructuredResponse.mockImplementation((params) => { seen.push(params._timeoutMs); throw failed(); });
    zai.generateStructuredResponse.mockImplementation((params) => { seen.push(params._timeoutMs); return { provider: 'zai' }; });
    await expect(ai.generateStructuredResponse({})).resolves.toEqual({ provider: 'zai' });
    expect(seen).toHaveLength(3);
    expect(seen[0]).toBeLessThanOrEqual(12);
    expect(seen[1]).toBeLessThanOrEqual(12);
    expect(seen[2]).toBeLessThanOrEqual(12);
  });

  test('does not start another provider after the global deadline', async () => {
    process.env.AI_OPERATION_TIMEOUT_MS = '20';
    process.env.AI_REQUEST_TIMEOUT = '12';
    cohere.generateStructuredResponse.mockImplementation(() => new Promise(() => {}));
    groq.generateStructuredResponse.mockImplementation(() => new Promise(() => {}));
    zai.generateStructuredResponse.mockImplementation(() => new Promise(() => {}));
    await expect(ai.generateStructuredResponse({})).rejects.toMatchObject({ statusCode: 503 });
    expect(cohere.generateStructuredResponse).toHaveBeenCalledTimes(1);
    expect(groq.generateStructuredResponse).toHaveBeenCalledTimes(1);
    expect(zai.generateStructuredResponse.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
