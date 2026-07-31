const { recordAnswer } = require('../performanceService');
const { INTERVIEW_TYPES } = require('../../constants/interviewTypes');

jest.mock('../../config/database', () => ({
  userPerformanceAggregate: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  user: { findMany: jest.fn() },
}));

jest.mock('../../lib/redis/cache', () => ({
  getJSON: jest.fn(),
  setJSON: jest.fn(),
  del: jest.fn(),
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
    prisma.userPerformanceAggregate.update.mockImplementation(({ data }) => Promise.resolve(data));
    cache.del.mockResolvedValue(undefined);
  });

  test('deletes leaderboard:global after a performance update', async () => {
    await recordAnswer(1, INTERVIEW_TYPES.HR, { communication: 80, leadership: 70, professionalism: 60, confidence: 50 });

    expect(cache.del).toHaveBeenCalledWith('leaderboard:global');
  });

  test('still persists the answer in PostgreSQL even when invalidation is a no-op', async () => {
    await recordAnswer(1, INTERVIEW_TYPES.HR, { communication: 80, leadership: 70, professionalism: 60, confidence: 50 });

    expect(prisma.userPerformanceAggregate.update).toHaveBeenCalledTimes(1);
  });

  test('does not throw when Redis is unavailable during invalidation', async () => {
    cache.del.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(recordAnswer(1, INTERVIEW_TYPES.HR, { communication: 80, leadership: 70, professionalism: 60, confidence: 50 })).resolves.toBeDefined();
  });
});
