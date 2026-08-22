const { recordAnswer, recordSession, snapshot, sessionContribution } = require('../performanceService');
const { INTERVIEW_TYPES } = require('../../constants/interviewTypes');

jest.mock('../../config/database', () => ({
  userPerformanceAggregate: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  interviewAnswer: { findMany: jest.fn() },
  interviewSession: { findUnique: jest.fn() },
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
    expect(prisma.userPerformanceAggregate.updateMany.mock.calls[1][0].data.coreSums.communication).toBe(73.5);
    expect(result.totalAnswers).toBe(2);
  });
});

describe('performanceService.recordSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.userPerformanceAggregate.findUnique.mockResolvedValue(blankAggregate());
    prisma.userPerformanceAggregate.updateMany.mockResolvedValue({ count: 1 });
  });

  test('contributes one sample per criterion using the session average', async () => {
    const result = await recordSession(1, INTERVIEW_TYPES.HR, [
      { communication: 60, leadership: 60, professionalism: 60, confidence: 60 },
      { communication: 100, leadership: 100, professionalism: 100, confidence: 100 },
    ]);

    expect(result.coreSums.communication).toBe(80);
    expect(result.coreCounts.communication).toBe(1);
    expect(result.coreSums.technology).toBe(0);
    expect(result.coreCounts.technology).toBe(0);
    expect(result.totalAnswers).toBe(2);
  });

  test('uses EMA so recent completed sessions have stronger influence', async () => {
    prisma.userPerformanceAggregate.findUnique
      .mockResolvedValueOnce({ ...blankAggregate(), coreSums: { communication: 70 }, coreCounts: { communication: 1 } })
      .mockResolvedValueOnce({ ...blankAggregate(), coreSums: { communication: 77 }, coreCounts: { communication: 1 } });

    const afterNinety = await recordSession(1, INTERVIEW_TYPES.HR, [{ communication: 90 }]);
    const afterNinetyFive = await recordSession(1, INTERVIEW_TYPES.HR, [{ communication: 95 }]);

    expect(afterNinety.coreSums.communication).toBe(77);
    expect(afterNinety.coreCounts.communication).toBe(1);
    expect(afterNinetyFive.coreSums.communication).toBe(83.3);
    expect(afterNinetyFive.coreCounts.communication).toBe(1);
  });

  test('records the highest demonstrated score for resume sessions', async () => {
    const result = await recordSession(1, INTERVIEW_TYPES.RESUME, [
      { communication: 40, technology: 30 },
      { communication: 90, technology: 70 },
    ]);

    expect(result.resumeHighScores.communication).toBe(90);
    expect(result.resumeHighScores.technology).toBe(70);
    expect(result.coreCounts.communication).toBe(0);
    expect(result.totalAnswers).toBe(2);
  });

  test('invalidates the leaderboard cache after a non-transactional update', async () => {
    cache.delByPattern.mockResolvedValue(undefined);
    await recordSession(1, INTERVIEW_TYPES.HR, [{ communication: 80 }]);

    expect(cache.delByPattern).toHaveBeenCalledWith('leaderboard:global:*');
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

describe('performanceService.sessionContribution', () => {
  const hrAnswers = (value) => [
    { analytics: { communication: value, leadership: value, professionalism: value, confidence: value } },
    { analytics: { communication: value, leadership: value, professionalism: value, confidence: value } },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.interviewAnswer.findMany.mockResolvedValue([]);
  });

  test('returns a positive contribution when the session raised the overall score', async () => {
    prisma.userPerformanceAggregate.findUnique.mockResolvedValue({
      coreSums: { communication: 150, leadership: 150, professionalism: 150, confidence: 150 },
      coreCounts: { communication: 2, leadership: 2, professionalism: 2, confidence: 2 },
      resumeHighScores: {},
      totalAnswers: 2,
    });
    prisma.interviewSession.findUnique.mockResolvedValue({ interviewType: INTERVIEW_TYPES.HR, answers: hrAnswers(90) });

    const result = await sessionContribution(1, 's2');

    expect(result.contribution).toBeCloseTo(15);
    expect(result.averageScore).toBeCloseTo(75);
    expect(result.withoutSession).toBeCloseTo(60);
    expect(result.contribution).toBeGreaterThan(0);
  });

  test('returns a negative contribution when the session dragged the score down', async () => {
    prisma.userPerformanceAggregate.findUnique.mockResolvedValue({
      coreSums: { communication: 100, leadership: 100, professionalism: 100, confidence: 100 },
      coreCounts: { communication: 2, leadership: 2, professionalism: 2, confidence: 2 },
      resumeHighScores: {},
      totalAnswers: 2,
    });
    prisma.interviewSession.findUnique.mockResolvedValue({ interviewType: INTERVIEW_TYPES.HR, answers: hrAnswers(30) });

    const result = await sessionContribution(1, 's2');

    expect(result.contribution).toBeCloseTo(-20);
    expect(result.averageScore).toBeCloseTo(50);
    expect(result.withoutSession).toBeCloseTo(70);
    expect(result.contribution).toBeLessThan(0);
  });

  test('zeroes the baseline when the session is the only contributor', async () => {
    prisma.userPerformanceAggregate.findUnique.mockResolvedValue({
      coreSums: { communication: 90, leadership: 90, professionalism: 90, confidence: 90 },
      coreCounts: { communication: 1, leadership: 1, professionalism: 1, confidence: 1 },
      resumeHighScores: {},
      totalAnswers: 2,
    });
    prisma.interviewSession.findUnique.mockResolvedValue({ interviewType: INTERVIEW_TYPES.HR, answers: hrAnswers(90) });

    const result = await sessionContribution(1, 's1');

    expect(result.averageScore).toBeCloseTo(90);
    expect(result.withoutSession).toBe(0);
    expect(result.contribution).toBeCloseTo(90);
  });
});
