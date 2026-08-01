const { getLeaderboard } = require('../leaderboardService');

const prisma = require('../../config/database');
const cache = require('../../lib/redis/cache');

jest.mock('../../config/database', () => ({
  userPerformanceAggregate: { findMany: jest.fn() },
  user: { findUnique: jest.fn() },
}));

jest.mock('../../lib/redis/cache', () => ({
  getJSON: jest.fn(),
  setJSON: jest.fn(),
  del: jest.fn(),
  delByPattern: jest.fn(),
}));

const row = (username, score, coveredKeys) => {
  const coreCounts = {};
  const coreSums = {};
  for (const key of coveredKeys) {
    coreCounts[key] = 1;
    coreSums[key] = score;
  }
  return { userId: 'u1', user: { username }, coreSums, coreCounts, resumeHighScores: {}, totalAnswers: coveredKeys.length };
};

describe('leaderboardService.getLeaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.getJSON.mockResolvedValue(null);
    cache.setJSON.mockResolvedValue(true);
    prisma.userPerformanceAggregate.findMany.mockResolvedValue([
      row('alice', 90, ['communication', 'leadership', 'professionalism', 'confidence', 'technology']),
      row('bob', 80, ['communication', 'leadership', 'professionalism']),
    ]);
  });

  test('caches each page size under its own key', async () => {
    await getLeaderboard(10);
    await getLeaderboard(50);

    expect(cache.getJSON).toHaveBeenCalledWith('leaderboard:global:10');
    expect(cache.getJSON).toHaveBeenCalledWith('leaderboard:global:50');
    expect(cache.setJSON).toHaveBeenCalledWith('leaderboard:global:10', expect.anything(), 300);
    expect(cache.setJSON).toHaveBeenCalledWith('leaderboard:global:50', expect.anything(), 300);
  });

  test('serves the cached payload on a hit without re-querying', async () => {
    cache.getJSON.mockResolvedValue([{ userId: 'u1', username: 'alice', rank: 1 }]);

    const result = await getLeaderboard(10);

    expect(prisma.userPerformanceAggregate.findMany).not.toHaveBeenCalled();
    expect(result).toEqual([{ userId: 'u1', username: 'alice', rank: 1 }]);
  });

  test('sorts and ranks entries on a miss', async () => {
    const result = await getLeaderboard(10);

    expect(result[0]).toMatchObject({ username: 'alice', rank: 1 });
    expect(result[1]).toMatchObject({ username: 'bob', rank: 2 });
    expect(result).toHaveLength(2);
  });

  test('still builds the leaderboard when Redis is unavailable', async () => {
    // The cache wrapper never throws; it degrades to a miss / no-op.
    cache.getJSON.mockResolvedValue(null);
    cache.setJSON.mockResolvedValue(false);

    const result = await getLeaderboard(10);

    expect(result).toHaveLength(2);
  });
});
