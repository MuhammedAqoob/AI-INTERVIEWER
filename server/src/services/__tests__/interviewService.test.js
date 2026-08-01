const { submitAnswer, getSessionsForUser } = require('../interviewService');

const prisma = require('../../config/database');
const ai = require('../ai');
const performanceService = require('../performanceService');

jest.mock('../../config/database', () => ({
  interviewAnswer: { create: jest.fn() },
  interviewSession: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  dailyInterviewUsage: { upsert: jest.fn() },
  $transaction: jest.fn(),
}));

jest.mock('../ai', () => ({
  generateInterviewTurn: jest.fn(),
  generateFinalEvaluation: jest.fn(),
}));

jest.mock('../performanceService', () => ({
  ensureAggregate: jest.fn(),
  recordAnswer: jest.fn(),
}));

const turn = (nextQuestion) => ({
  betterAnswer: 'better',
  updatedSummary: 'summary',
  analytics: { communication: 80, leadership: 70, professionalism: 60, confidence: 50 },
  nextQuestion,
});

const session = (overrides = {}) => ({
  id: 's1',
  userId: 1,
  interviewType: 'HR',
  branch: null,
  status: 'ACTIVE',
  questionLimit: 2,
  currentQuestionNumber: 1,
  currentQuestion: { content: 'Question 1', difficulty: 'EASY' },
  currentDifficulty: 'EASY',
  rollingSummary: '',
  resumeSummary: null,
  startedAt: new Date(),
  endedAt: null,
  answers: [],
  ...overrides,
});

describe('interviewService.submitAnswer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.interviewSession.findUnique.mockResolvedValue(session());
    prisma.interviewAnswer.create.mockImplementation(({ data }) => Promise.resolve({ id: 'a1', ...data }));
    prisma.interviewSession.update.mockImplementation(({ data }) => Promise.resolve({ ...session(), ...data }));
    prisma.$transaction.mockImplementation((fn) => fn(prisma));
    ai.generateInterviewTurn.mockResolvedValue(turn({ content: 'Question 2', difficulty: 'MEDIUM' }));
    ai.generateFinalEvaluation.mockResolvedValue({
      overallSummary: 'Great',
      strengths: ['a'],
      weaknesses: ['b'],
      hireRecommendation: 'YES',
      hireReason: 'c',
      learningRoadmap: ['d'],
    });
    performanceService.ensureAggregate.mockResolvedValue({});
    performanceService.recordAnswer.mockResolvedValue({});
  });

  test('saves the answer and advances the session for a non-final turn', async () => {
    const result = await submitAnswer(1, { sessionId: 's1', answer: 'My answer' });

    expect(prisma.interviewAnswer.create).toHaveBeenCalledTimes(1);
    expect(prisma.interviewSession.update).toHaveBeenCalledTimes(1);
    expect(result.interviewEnded).toBe(false);
    expect(result.nextQuestion).toEqual({ content: 'Question 2', difficulty: 'MEDIUM' });
    expect(ai.generateFinalEvaluation).not.toHaveBeenCalled();
  });

  test('marks the session COMPLETED with an evaluation on the final turn', async () => {
    prisma.interviewSession.findUnique.mockResolvedValue(
      session({ currentQuestionNumber: 2, currentQuestion: { content: 'Question 2', difficulty: 'MEDIUM' } })
    );

    const result = await submitAnswer(1, { sessionId: 's1', answer: 'Final answer' });

    expect(ai.generateFinalEvaluation).toHaveBeenCalledTimes(1);
    expect(result.interviewEnded).toBe(true);
    expect(result.status).toBe('COMPLETED');
    const updateCall = prisma.interviewSession.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe('COMPLETED');
    expect(updateCall.data.overallSummary).toBe('Great');
    expect(result.finalEvaluation.overallAverage).toBeGreaterThan(0);
  });

  test('leaves the session ACTIVE and retryable when the AI fails on the final turn', async () => {
    prisma.interviewSession.findUnique.mockResolvedValue(
      session({ currentQuestionNumber: 2, currentQuestion: { content: 'Question 2', difficulty: 'MEDIUM' } })
    );
    ai.generateFinalEvaluation.mockRejectedValue(new Error('provider down'));

    await expect(submitAnswer(1, { sessionId: 's1', answer: 'Final answer' })).rejects.toThrow('provider down');
    // No answer persisted and no session mutation: the candidate can retry.
    expect(prisma.interviewAnswer.create).not.toHaveBeenCalled();
    expect(prisma.interviewSession.update).not.toHaveBeenCalled();
  });

  test('rejects a duplicate in-flight submission with 409', async () => {
    const first = submitAnswer(1, { sessionId: 's1', answer: 'First' });
    await expect(submitAnswer(1, { sessionId: 's1', answer: 'Second' })).rejects.toMatchObject({ statusCode: 409 });
    await first;
  });

  test('rejects answers for sessions that are not active', async () => {
    prisma.interviewSession.findUnique.mockResolvedValue(session({ status: 'PAUSED' }));

    await expect(submitAnswer(1, { sessionId: 's1', answer: 'Answer' })).rejects.toMatchObject({ statusCode: 409 });
    expect(prisma.interviewAnswer.create).not.toHaveBeenCalled();
  });

  test('uses a transaction so the answer and session update are atomic', async () => {
    await submitAnswer(1, { sessionId: 's1', answer: 'My answer' });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe('interviewService.getSessionsForUser', () => {
  test('serializes analytics metrics for each session', async () => {
    prisma.interviewSession.findMany.mockResolvedValue([
      session({
        status: 'COMPLETED',
        answers: [
          { id: 'a1', analytics: { communication: 80, leadership: 70, professionalism: 60, confidence: 50 } },
          { id: 'a2', analytics: { communication: 60, leadership: 50, professionalism: 40, confidence: 30 } },
        ],
      }),
    ]);

    const rows = await getSessionsForUser(1);

    expect(rows[0].turnCount).toBe(2);
    expect(rows[0].analyticsSamples).toBe(2);
    expect(rows[0].overallAverage).toBeGreaterThan(0);
  });
});
