const { recordAnswer, snapshot } = require('../performanceService');
const { INTERVIEW_TYPES } = require('../../constants/interviewTypes');

jest.mock('../../config/database', () => ({
  userPerformanceAggregate: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  user: { findMany: jest.fn() },
}));

jest.mock('../../lib/redis/cache', () => ({
  getJSON: jest.fn(),
  setJSON: jest.fn(),
  del: jest.fn(),
  delByPattern: jest.fn(),
}));

const prisma = require('../../config/database');
const cache = require('../../lib/redis/cache');

const blankAggregate = () => ({
  userId: 1,
  coreSums: {},
  coreCounts: {},
  resumeHighScores: {},
  totalAnswers: 0,
});

describe('leaderboard cache invalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.userPerformanceAggregate.findUnique.mockResolvedValue(blankAggregate());
    prisma.userPerformanceAggregate.updateMany.mockResolvedValue({ count: 1 });
    cache.delByPattern.mockResolvedValue(undefined);
  });

  test('deletes all leaderboard:* caches after a performance update', async () => {
    await recordAnswer(1, INTERVIEW_TYPES.HR, { communication: 80, leadership: 70, professionalism: 60, confidence: 50 });

    expect(cache.delByPattern).toHaveBeenCalledWith('leaderboard:global:*');
  });

  test('still persists the answer in PostgreSQL even when invalidation is a no-op', async () => {
    await recordAnswer(1, INTERVIEW_TYPES.HR, { communication: 80, leadership: 70, professionalism: 60, confidence: 50 });

    expect(prisma.userPerformanceAggregate.updateMany).toHaveBeenCalledTimes(1);
  });

  test('does not throw when Redis is unavailable during invalidation', async () => {
    cache.delByPattern.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(recordAnswer(1, INTERVIEW_TYPES.HR, { communication: 80, leadership: 70, professionalism: 60, confidence: 50 })).resolves.toBeDefined();
  });

  test('retries a revision conflict so a concurrent update is not lost', async () => {
    prisma.userPerformanceAggregate.findUnique
      .mockResolvedValueOnce({ ...blankAggregate(), revision: 0 })
      .mockResolvedValueOnce({ ...blankAggregate(), revision: 1, coreSums: { communication: 70 }, coreCounts: { communication: 1 }, totalAnswers: 1 });
    prisma.userPerformanceAggregate.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });

    const result = await recordAnswer(1, INTERVIEW_TYPES.HR, { communication: 80 });

    expect(prisma.userPerformanceAggregate.updateMany).toHaveBeenCalledTimes(2);
    expect(prisma.userPerformanceAggregate.updateMany.mock.calls[1][0].data.coreSums.communication).toBe(150);
    expect(result.totalAnswers).toBe(2);
  });
});

describe('performanceService.snapshot', () => {
  test('averages only the covered metrics instead of dividing by all core metrics', () => {
    const result = snapshot({
      coreSums: { communication: 60.5, leadership: 60.5, professionalism: 60.5, confidence: 60.5 },
      coreCounts: { communication: 1, leadership: 1, professionalism: 1, confidence: 1 },
      resumeHighScores: {},
      totalAnswers: 1,
    });

    expect(result.criteriaCovered).toBe(4);
    expect(result.averageScore).toBeCloseTo(60.5);
    expect(result.categoryScores.HR).toBeCloseTo(60.5);
    expect(result.categoryScores.TECHNICAL).toBeNull();
    expect(result.categoryScores.APTITUDE).toBeNull();
  });

  test('returns zero average and null categories when nothing is covered', () => {
    const result = snapshot({ coreSums: {}, coreCounts: {}, resumeHighScores: {}, totalAnswers: 0 });

    expect(result.criteriaCovered).toBe(0);
    expect(result.averageScore).toBe(0);
    expect(result.categoryScores.TECHNICAL).toBeNull();
    expect(result.categoryScores.HR).toBeNull();
    expect(result.categoryScores.APTITUDE).toBeNull();
  });
});
