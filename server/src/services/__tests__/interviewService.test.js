const { submitAnswer, getSessionsForUser, endSession, getSessionById } = require('../interviewService');

const prisma = require('../../config/database');
const ai = require('../ai');
const performanceService = require('../performanceService');

jest.mock('../../config/database', () => ({
  interviewAnswer: { create: jest.fn() },
  interviewSession: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  dailyInterviewUsage: { upsert: jest.fn() },
  $transaction: jest.fn(),
}));

jest.mock('../ai', () => ({
  generateInterviewTurn: jest.fn(),
}));

jest.mock('../performanceService', () => ({
  ensureAggregate: jest.fn(),
  recordSession: jest.fn(),
  invalidateLeaderboard: jest.fn(),
  sessionContribution: jest.fn(),
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
    prisma.interviewSession.findUnique
      .mockResolvedValueOnce(session())
      .mockResolvedValue({ ...session(), currentQuestionNumber: 2, currentQuestion: { content: 'Question 2', difficulty: 'MEDIUM' }, currentDifficulty: 'MEDIUM' });
    prisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
    prisma.interviewAnswer.create.mockImplementation(({ data }) => Promise.resolve({ id: 'a1', ...data }));
    prisma.$transaction.mockImplementation((fn) => fn(prisma));
    ai.generateInterviewTurn.mockResolvedValue(turn({ content: 'Question 2', difficulty: 'MEDIUM' }));
    performanceService.ensureAggregate.mockResolvedValue({});
    performanceService.recordSession.mockResolvedValue({});
    performanceService.invalidateLeaderboard.mockResolvedValue(undefined);
  });

  test('saves the answer and advances the session for a non-final turn', async () => {
    const result = await submitAnswer(1, { sessionId: 's1', answer: 'My answer' });

    expect(prisma.interviewAnswer.create).toHaveBeenCalledTimes(1);
    expect(prisma.interviewSession.updateMany).toHaveBeenCalledTimes(2);
    expect(result.interviewEnded).toBe(false);
    expect(result.nextQuestion).toEqual({ content: 'Question 2', difficulty: 'MEDIUM' });
    expect(result.finalEvaluation).toBeNull();
  });

  test('does not contribute to the leaderboard until the interview is completed', async () => {
    await submitAnswer(1, { sessionId: 's1', answer: 'My answer' });

    expect(performanceService.recordSession).not.toHaveBeenCalled();
  });

  test('marks the session COMPLETED on the final turn without a separate evaluation call', async () => {
    const finalSession = session({ currentQuestionNumber: 2, currentQuestion: { content: 'Question 2', difficulty: 'MEDIUM' } });
    prisma.interviewSession.findUnique.mockReset();
    prisma.interviewSession.findUnique.mockResolvedValueOnce(finalSession).mockResolvedValueOnce({ ...finalSession, status: 'COMPLETED', currentQuestion: null });

    const result = await submitAnswer(1, { sessionId: 's1', answer: 'Final answer' });

    expect(result.interviewEnded).toBe(true);
    expect(result.status).toBe('COMPLETED');
    const updateCall = prisma.interviewSession.updateMany.mock.calls[1][0];
    expect(updateCall.data.status).toBe('COMPLETED');
    expect(updateCall.data.overallSummary).toBeUndefined();
    expect(result.finalEvaluation.overallAverage).toBeGreaterThan(0);
  });

  test('records the session to the leaderboard once, on the final turn', async () => {
    const finalSession = session({ currentQuestionNumber: 2, currentQuestion: { content: 'Question 2', difficulty: 'MEDIUM' } });
    prisma.interviewSession.findUnique.mockReset();
    prisma.interviewSession.findUnique.mockResolvedValueOnce(finalSession).mockResolvedValueOnce({ ...finalSession, status: 'COMPLETED', currentQuestion: null });

    await submitAnswer(1, { sessionId: 's1', answer: 'Final answer' });

    expect(performanceService.recordSession).toHaveBeenCalledTimes(1);
    expect(performanceService.recordSession.mock.calls[0][0]).toBe(1);
    expect(performanceService.recordSession.mock.calls[0][1]).toBe('HR');
    expect(performanceService.recordSession.mock.calls[0][2]).toEqual([expect.objectContaining({ communication: 80 })]);
  });

  test('leaves the session ACTIVE and retryable when the AI fails on the final turn', async () => {
    prisma.interviewSession.findUnique.mockReset();
    prisma.interviewSession.findUnique.mockResolvedValue(session({ currentQuestionNumber: 2, currentQuestion: { content: 'Question 2', difficulty: 'MEDIUM' } }));
    ai.generateInterviewTurn.mockRejectedValue(new Error('provider down'));

    await expect(submitAnswer(1, { sessionId: 's1', answer: 'Final answer' })).rejects.toThrow('provider down');
    // No answer persisted and no session mutation: the candidate can retry.
    expect(prisma.interviewAnswer.create).not.toHaveBeenCalled();
    expect(prisma.interviewSession.updateMany).toHaveBeenCalledTimes(2); // claim then release
  });

  test('rejects a duplicate in-flight submission with 409', async () => {
    const first = submitAnswer(1, { sessionId: 's1', answer: 'First' });
    await expect(submitAnswer(1, { sessionId: 's1', answer: 'Second' })).rejects.toMatchObject({ statusCode: 409 });
    await first;
  });

  test('does not call AI when another process has already claimed the question', async () => {
    prisma.interviewSession.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(submitAnswer(1, { sessionId: 's1', answer: 'Duplicate' })).rejects.toMatchObject({ statusCode: 409 });
    expect(ai.generateInterviewTurn).not.toHaveBeenCalled();
    expect(prisma.interviewAnswer.create).not.toHaveBeenCalled();
  });

  test('returns a controlled conflict if the session version changes before commit', async () => {
    prisma.interviewSession.updateMany
      .mockResolvedValueOnce({ count: 1 }) // claim
      .mockResolvedValueOnce({ count: 0 }) // transaction state transition
      .mockResolvedValueOnce({ count: 1 }); // release
    await expect(submitAnswer(1, { sessionId: 's1', answer: 'Race' })).rejects.toMatchObject({ statusCode: 409 });
    expect(prisma.interviewAnswer.create).toHaveBeenCalledTimes(1);
  });

  test('rejects answers for sessions that are not active', async () => {
    prisma.interviewSession.findUnique.mockReset();
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

describe('interviewService.endSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
    prisma.$transaction.mockImplementation((fn) => fn(prisma));
    performanceService.recordSession.mockResolvedValue({});
    performanceService.invalidateLeaderboard.mockResolvedValue(undefined);
  });

  test('completes an active session immediately without an AI evaluation call', async () => {
    prisma.interviewSession.findUnique.mockReset();
    prisma.interviewSession.findUnique.mockResolvedValueOnce(
      session({
        answers: [{ id: 'a1', analytics: { communication: 80, leadership: 70, professionalism: 60, confidence: 50 } }],
      })
    );
    prisma.interviewSession.findUnique.mockResolvedValueOnce(session({ status: 'COMPLETED', currentQuestion: null }));

    const result = await endSession(1, 's1');

    expect(prisma.interviewSession.updateMany).toHaveBeenCalledTimes(1);
    const where = prisma.interviewSession.updateMany.mock.calls[0][0].where;
    expect(where.id).toBe('s1');
    expect(where.status.in).toEqual(['ACTIVE', 'PAUSED']);
    const data = prisma.interviewSession.updateMany.mock.calls[0][0].data;
    expect(data.status).toBe('COMPLETED');
    expect(data.overallSummary).toBeUndefined();
    expect(result.status).toBe('COMPLETED');
    expect(performanceService.invalidateLeaderboard).toHaveBeenCalledTimes(1);
  });

  test('records the force-completed session to the leaderboard exactly once', async () => {
    prisma.interviewSession.findUnique.mockReset();
    prisma.interviewSession.findUnique.mockResolvedValueOnce(
      session({
        answers: [
          { id: 'a1', analytics: { communication: 80, leadership: 70, professionalism: 60, confidence: 50 } },
          { id: 'a2', analytics: { communication: 60, leadership: 50, professionalism: 40, confidence: 30 } },
        ],
      })
    );
    prisma.interviewSession.findUnique.mockResolvedValueOnce(session({ status: 'COMPLETED', currentQuestion: null }));

    await endSession(1, 's1');

    expect(performanceService.recordSession).toHaveBeenCalledTimes(1);
    expect(performanceService.recordSession.mock.calls[0][0]).toBe(1);
    expect(performanceService.recordSession.mock.calls[0][1]).toBe('HR');
    expect(performanceService.recordSession.mock.calls[0][2]).toHaveLength(2);
  });

  test('does not record an empty session that was force-completed', async () => {
    prisma.interviewSession.findUnique.mockReset();
    prisma.interviewSession.findUnique.mockResolvedValueOnce(session());
    prisma.interviewSession.findUnique.mockResolvedValueOnce(session({ status: 'COMPLETED', currentQuestion: null }));

    await endSession(1, 's1');

    expect(performanceService.recordSession).not.toHaveBeenCalled();
  });

  test('returns the session unchanged when it is already COMPLETED', async () => {
    prisma.interviewSession.findUnique.mockReset();
    prisma.interviewSession.findUnique.mockResolvedValue(session({ status: 'COMPLETED' }));

    const result = await endSession(1, 's1');

    expect(prisma.interviewSession.updateMany).not.toHaveBeenCalled();
    expect(result.status).toBe('COMPLETED');
  });

  test('rejects when the session state changed or an answer is in flight', async () => {
    prisma.interviewSession.findUnique.mockReset();
    prisma.interviewSession.findUnique.mockResolvedValue(session());
    prisma.interviewSession.updateMany.mockResolvedValue({ count: 0 });

    await expect(endSession(1, 's1')).rejects.toMatchObject({ statusCode: 409 });
  });

  test('rejects sessions in a terminal state that is not COMPLETED', async () => {
    prisma.interviewSession.findUnique.mockReset();
    prisma.interviewSession.findUnique.mockResolvedValue(session({ status: 'ABANDONED' }));

    await expect(endSession(1, 's1')).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('interviewService.getSessionById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('attaches the leaderboard score contribution for completed sessions', async () => {
    prisma.interviewSession.findUnique.mockReset();
    prisma.interviewSession.findUnique.mockResolvedValue(
      session({
        status: 'COMPLETED',
        answers: [{ id: 'a1', analytics: { communication: 80, leadership: 70, professionalism: 60, confidence: 50 } }],
      })
    );
    performanceService.sessionContribution.mockResolvedValue({ averageScore: 65, withoutSession: 55, contribution: 10 });

    const result = await getSessionById(1, 's1');

    expect(performanceService.sessionContribution).toHaveBeenCalledWith(1, 's1');
    expect(result.scoreContribution).toEqual({ averageScore: 65, withoutSession: 55, contribution: 10 });
  });

  test('does not compute a contribution for active sessions', async () => {
    prisma.interviewSession.findUnique.mockReset();
    prisma.interviewSession.findUnique.mockResolvedValue(session());

    const result = await getSessionById(1, 's1');

    expect(performanceService.sessionContribution).not.toHaveBeenCalled();
    expect(result.scoreContribution).toBeUndefined();
  });
});
