jest.mock('../ai/zai', () => ({ generateStructuredResponse: jest.fn(), generateInterviewTurn: jest.fn(), generateFirstQuestion: jest.fn() }));
jest.mock('../ai/gemini', () => ({ generateStructuredResponse: jest.fn(), generateInterviewTurn: jest.fn(), generateFirstQuestion: jest.fn() }));
jest.mock('../ai/groq', () => ({ generateStructuredResponse: jest.fn(), generateInterviewTurn: jest.fn(), generateFirstQuestion: jest.fn() }));

const zai = require('../ai/zai');
const gemini = require('../ai/gemini');
const groq = require('../ai/groq');
const ai = require('../ai');

const transient = (status = 429) => Object.assign(new Error(`provider failed ${status}`), { status });
const permanent = () => Object.assign(new Error('invalid API key'), { status: 401 });

describe('AI execution policy', () => {
  const env = process.env;
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...env, AI_PROVIDER: 'zai', AI_RETRY_COUNT: '1', AI_RETRY_BASE_DELAY_MS: '1', AI_RETRY_MAX_DELAY_MS: '2', AI_OPERATION_TIMEOUT_MS: '100', AI_PROVIDER_SLOT_WAIT_MS: '20', AI_ZAI_CONCURRENCY: '4', AI_CIRCUIT_FAILURE_THRESHOLD: '3', AI_CIRCUIT_COOLDOWN_MS: '1000' };
    ai.__resetProviderStateForTests();
    zai.generateStructuredResponse.mockResolvedValue({ ok: 'zai' });
    gemini.generateStructuredResponse.mockResolvedValue({ ok: 'gemini' });
    groq.generateStructuredResponse.mockResolvedValue({ ok: 'groq' });
  });
  afterAll(() => { process.env = env; });

  test('retries a transient failure and then succeeds', async () => {
    zai.generateStructuredResponse.mockRejectedValueOnce(transient()).mockResolvedValueOnce({ ok: true });
    await expect(ai.generateStructuredResponse({})).resolves.toEqual({ ok: true });
    expect(zai.generateStructuredResponse).toHaveBeenCalledTimes(2);
    expect(gemini.generateStructuredResponse).not.toHaveBeenCalled();
  });

  test('does not retry or fall back for a permanent configuration error', async () => {
    zai.generateStructuredResponse.mockRejectedValue(permanent());
    await expect(ai.generateStructuredResponse({})).rejects.toMatchObject({ statusCode: 503 });
    expect(zai.generateStructuredResponse).toHaveBeenCalledTimes(1);
    expect(gemini.generateStructuredResponse).not.toHaveBeenCalled();
  });

  test('falls back to the next healthy provider after transient failures', async () => {
    zai.generateStructuredResponse.mockRejectedValue(transient());
    await expect(ai.generateStructuredResponse({})).resolves.toEqual({ ok: 'gemini' });
    expect(zai.generateStructuredResponse).toHaveBeenCalledTimes(2);
    expect(gemini.generateStructuredResponse).toHaveBeenCalledTimes(1);
  });

  test('treats a provider error carrying HTTP 429 as retryable', async () => {
    zai.generateStructuredResponse.mockRejectedValueOnce(transient(429)).mockRejectedValueOnce(transient(429));
    await expect(ai.generateStructuredResponse({})).resolves.toEqual({ ok: 'gemini' });
    expect(gemini.generateStructuredResponse).toHaveBeenCalledTimes(1);
  });

  test('bounds concurrent calls to a provider and waits for a slot', async () => {
    process.env.AI_ZAI_CONCURRENCY = '1';
    let release;
    zai.generateStructuredResponse.mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
    const first = ai.generateStructuredResponse({});
    await new Promise((resolve) => setImmediate(resolve));
    const second = ai.generateStructuredResponse({});
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(zai.generateStructuredResponse).toHaveBeenCalledTimes(1);
    release({ first: true });
    await expect(first).resolves.toEqual({ first: true });
    await expect(second).resolves.toEqual({ ok: 'zai' });
    expect(zai.generateStructuredResponse).toHaveBeenCalledTimes(2);
  });

  test('opens a cooldown circuit after repeated transient failures', async () => {
    process.env.AI_RETRY_COUNT = '0';
    process.env.AI_CIRCUIT_FAILURE_THRESHOLD = '1';
    zai.generateStructuredResponse.mockRejectedValue(transient());
    await expect(ai.generateStructuredResponse({})).resolves.toEqual({ ok: 'gemini' });
    await expect(ai.generateStructuredResponse({})).resolves.toEqual({ ok: 'gemini' });
    expect(zai.generateStructuredResponse).toHaveBeenCalledTimes(1);
  });

  test('falls back when a circuit opens between retry attempts', async () => {
    process.env.AI_RETRY_COUNT = '1';
    process.env.AI_CIRCUIT_FAILURE_THRESHOLD = '1';
    zai.generateStructuredResponse.mockRejectedValue(transient());
    await expect(ai.generateStructuredResponse({})).resolves.toEqual({ ok: 'gemini' });
    expect(zai.generateStructuredResponse).toHaveBeenCalledTimes(1);
    expect(gemini.generateStructuredResponse).toHaveBeenCalledTimes(1);
  });

  test('enforces one total operation deadline', async () => {
    process.env.AI_OPERATION_TIMEOUT_MS = '15';
    process.env.AI_RETRY_COUNT = '0';
    zai.generateStructuredResponse.mockImplementation(() => new Promise(() => {}));
    await expect(ai.generateStructuredResponse({})).rejects.toMatchObject({ statusCode: 503 });
  });

  test('returns a controlled error when every provider is unavailable before the deadline', async () => {
    process.env.AI_RETRY_COUNT = '0';
    zai.generateStructuredResponse.mockRejectedValue(transient());
    gemini.generateStructuredResponse.mockRejectedValue(transient(503));
    groq.generateStructuredResponse.mockRejectedValue(transient(503));
    await expect(ai.generateStructuredResponse({})).rejects.toMatchObject({ statusCode: 503 });
  });
});
