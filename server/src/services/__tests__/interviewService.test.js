const { submitAnswer, getSessionsForUser, endSession, getSessionById, retakeInterview, startInterview } = require('../interviewService');

const prisma = require('../../config/database');
const ai = require('../ai');
const performanceService = require('../performanceService');

jest.mock('../../config/database', () => ({
  interviewAnswer: { create: jest.fn() },
  interviewSession: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  dailyInterviewUsage: { upsert: jest.fn() },
  $transaction: jest.fn(),
}));

jest.mock('../ai', () => ({
  generateInterviewTurn: jest.fn(),
  generateFirstQuestion: jest.fn(),
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

jest.mock('../questionProvider', () => ({
  getRandomQuestion: jest.fn(),
}));

const questionProvider = require('../questionProvider');

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
  openingQuestionContent: 'Question 1',
  openingQuestionDifficulty: 'EASY',
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

describe('interviewService.startInterview – question rotation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.interviewSession.findMany.mockResolvedValue([]);
    prisma.interviewSession.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'new-session', ...data, startedAt: new Date(), updatedAt: new Date(), status: 'ACTIVE', currentQuestionNumber: 1, revision: 0, rollingSummary: '' })
    );
    prisma.dailyInterviewUsage.upsert.mockResolvedValue({ interviewsStarted: 0, id: 'du1' });
    questionProvider.getRandomQuestion.mockResolvedValue({ content: 'HR Q1', difficulty: 'EASY' });
  });

  test('queries used questions and passes them to questionProvider', async () => {
    prisma.interviewSession.findMany.mockResolvedValue([
      { openingQuestionContent: 'HR Q1' },
      { openingQuestionContent: 'HR Q2' },
    ]);

    await startInterview(1, { interviewType: 'HR', branch: null, questionLimit: 5 });

    expect(prisma.interviewSession.findMany).toHaveBeenCalledTimes(1);
    const findManyWhere = prisma.interviewSession.findMany.mock.calls[0][0].where;
    expect(findManyWhere.userId).toBe(1);
    expect(findManyWhere.interviewType).toBe('HR');
    expect(findManyWhere.status).toBe('COMPLETED');
    expect(findManyWhere.branch).toBeNull();
    expect(questionProvider.getRandomQuestion).toHaveBeenCalledWith(null, 'HR', ['HR Q1', 'HR Q2']);
  });

  test('stores opening question in the new session', async () => {
    await startInterview(1, { interviewType: 'HR', branch: null, questionLimit: 5 });

    const createData = prisma.interviewSession.create.mock.calls[0][0].data;
    expect(createData.openingQuestionContent).toBe('HR Q1');
    expect(createData.openingQuestionDifficulty).toBe('EASY');
  });

  test('passes empty excludeContents when no completed sessions exist', async () => {
    prisma.interviewSession.findMany.mockResolvedValue([]);

    await startInterview(1, { interviewType: 'HR', branch: null, questionLimit: 5 });

    expect(questionProvider.getRandomQuestion).toHaveBeenCalledWith(null, 'HR', []);
  });

  test('branches for Technical include the branch in the query', async () => {
    await startInterview(1, { interviewType: 'TECHNICAL', branch: 'COMPUTER_SCIENCE', questionLimit: 5 });

    const findManyWhere = prisma.interviewSession.findMany.mock.calls[0][0].where;
    expect(findManyWhere.branch).toBe('COMPUTER_SCIENCE');
    expect(findManyWhere.interviewType).toBe('TECHNICAL');
  });

  test('does not store opening question for resume interviews (resume uses AI)', async () => {
    // Resume interviews call startResumeInterview, not startInterview.
    // startInterview throws for RESUME type.
    await expect(
      startInterview(1, { interviewType: 'RESUME', branch: null, questionLimit: 5 })
    ).rejects.toThrow('Resume interviews require a file upload');
  });
});

describe('interviewService.retakeInterview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.interviewSession.findUnique.mockReset();
    prisma.interviewSession.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'retake-session', ...data, startedAt: new Date(), updatedAt: new Date(), status: 'ACTIVE', currentQuestionNumber: 1, revision: 0, rollingSummary: '' })
    );
    prisma.dailyInterviewUsage.upsert.mockResolvedValue({ interviewsStarted: 0, id: 'du1' });
  });

  test('creates a new session with the same opening question as the original', async () => {
    prisma.interviewSession.findUnique.mockResolvedValue(session({
      openingQuestionContent: 'HR Q17',
      openingQuestionDifficulty: 'MEDIUM',
    }));

    const result = await retakeInterview(1, 's1');

    expect(prisma.interviewSession.create).toHaveBeenCalledTimes(1);
    const createData = prisma.interviewSession.create.mock.calls[0][0].data;
    expect(createData.openingQuestionContent).toBe('HR Q17');
    expect(createData.openingQuestionDifficulty).toBe('MEDIUM');
    expect(createData.currentQuestion).toEqual({ content: 'HR Q17', difficulty: 'MEDIUM' });
  });

  test('preserves original session (does not overwrite it)', async () => {
    prisma.interviewSession.findUnique.mockResolvedValue(session({
      openingQuestionContent: 'HR Q17',
      openingQuestionDifficulty: 'EASY',
    }));

    await retakeInterview(1, 's1');

    // Original session is not modified
    expect(prisma.interviewSession.updateMany).not.toHaveBeenCalled();
    expect(prisma.interviewSession.update).not.toHaveBeenCalled();
  });

  test('rejects resume interviews', async () => {
    prisma.interviewSession.findUnique.mockResolvedValue(session({
      interviewType: 'RESUME',
      openingQuestionContent: null,
    }));

    await expect(retakeInterview(1, 's1')).rejects.toThrow('Resume interviews generate new AI questions');
  });

  test('rejects sessions without openingQuestionContent', async () => {
    prisma.interviewSession.findUnique.mockResolvedValue(session({
      openingQuestionContent: null,
    }));

    await expect(retakeInterview(1, 's1')).rejects.toThrow('does not have a trackable opening question');
  });

  test('rejects if session belongs to a different user', async () => {
    prisma.interviewSession.findUnique.mockResolvedValue(session({ userId: 999 }));

    await expect(retakeInterview(1, 's1')).rejects.toThrow('Unauthorized');
  });

  test('uses the same questionLimit as the original', async () => {
    prisma.interviewSession.findUnique.mockResolvedValue(session({
      questionLimit: 10,
      openingQuestionContent: 'HR Q5',
      openingQuestionDifficulty: 'HARD',
    }));

    await retakeInterview(1, 's1');

    const createData = prisma.interviewSession.create.mock.calls[0][0].data;
    expect(createData.questionLimit).toBe(10);
  });
});
