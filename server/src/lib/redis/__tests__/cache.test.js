const { getJSON, setJSON, del } = require('../cache');

jest.mock('../client', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

const client = require('../client');

describe('redis cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getJSON', () => {
    test('cache hit: returns the parsed value when the key exists', async () => {
      const payload = [{ userId: 1, username: 'alice', rank: 1 }];
      client.get.mockResolvedValue(JSON.stringify(payload));

      await expect(getJSON('leaderboard:global')).resolves.toEqual(payload);
      expect(client.get).toHaveBeenCalledWith('leaderboard:global');
    });

    test('cache miss: returns null when the key does not exist', async () => {
      client.get.mockResolvedValue(null);

      await expect(getJSON('leaderboard:global')).resolves.toBeNull();
    });

    test('redis unavailable: returns null instead of throwing', async () => {
      client.get.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(getJSON('leaderboard:global')).resolves.toBeNull();
    });

    test('malformed payload: returns null instead of throwing', async () => {
      client.get.mockResolvedValue('{not-json');

      await expect(getJSON('leaderboard:global')).resolves.toBeNull();
    });
  });

  describe('setJSON', () => {
    test('stores the value as JSON with an expiry when a TTL is provided', async () => {
      client.set.mockResolvedValue('OK');

      await expect(setJSON('leaderboard:global', [1, 2], 300)).resolves.toBe(true);
      expect(client.set).toHaveBeenCalledWith('leaderboard:global', '[1,2]', 'EX', 300);
    });

    test('stores the value without TTL when none is provided', async () => {
      client.set.mockResolvedValue('OK');

      await expect(setJSON('leaderboard:global', 'value')).resolves.toBe(true);
      expect(client.set).toHaveBeenCalledWith('leaderboard:global', '"value"');
    });

    test('redis unavailable: returns false instead of throwing', async () => {
      client.set.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(setJSON('leaderboard:global', 'value')).resolves.toBe(false);
    });
  });

  describe('del', () => {
    test('deletes the key', async () => {
      client.del.mockResolvedValue(1);

      await expect(del('leaderboard:global')).resolves.toBeUndefined();
      expect(client.del).toHaveBeenCalledWith('leaderboard:global');
    });

    test('redis unavailable: swallows the error instead of throwing', async () => {
      client.del.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(del('leaderboard:global')).resolves.toBeUndefined();
    });
  });
});
