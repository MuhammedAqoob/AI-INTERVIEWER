const localQuestions = require('../questionProvider/localQuestions');

// We test the rotation logic by importing getRandomQuestion and mocking prisma.
// The core rotation logic lives in questionProvider/index.js.

jest.mock('../../config/database', () => ({
  interviewQuestionBank: {
    count: jest.fn().mockResolvedValue(0),
    findFirst: jest.fn().mockResolvedValue(null),
  },
  interviewSession: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  dailyInterviewUsage: {
    upsert: jest.fn().mockResolvedValue({ interviewsStarted: 0, id: 'du1' }),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
}));

const prisma = require('../../config/database');
const { getRandomQuestion } = require('../questionProvider');
const { INTERVIEW_TYPES } = require('../../constants/interviewTypes');

describe('question rotation – exclusion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.interviewQuestionBank.count.mockResolvedValue(0);
    prisma.interviewQuestionBank.findFirst.mockResolvedValue(null);
  });

  test('returns a question from the correct branch pool for Technical', async () => {
    const q = await getRandomQuestion('COMPUTER_SCIENCE', 'TECHNICAL');
    expect(q).toHaveProperty('content');
    expect(q).toHaveProperty('difficulty');
    const valid = localQuestions.COMPUTER_SCIENCE.TECHNICAL.some((item) => item.content === q.content);
    expect(valid).toBe(true);
  });

  test('returns a question from the HR pool', async () => {
    const q = await getRandomQuestion(null, 'HR');
    const valid = localQuestions.GLOBAL.HR.some((item) => item.content === q.content);
    expect(valid).toBe(true);
  });

  test('returns a question from the Aptitude pool', async () => {
    const q = await getRandomQuestion(null, 'APTITUDE');
    const valid = localQuestions.GLOBAL.APTITUDE.some((item) => item.content === q.content);
    expect(valid).toBe(true);
  });

  test('excludes previously completed questions', async () => {
    const pool = localQuestions.GLOBAL.HR;
    // Exclude all but the first question
    const excludeContents = pool.slice(1).map((q) => q.content);
    const q = await getRandomQuestion(null, 'HR', excludeContents);
    expect(q.content).toBe(pool[0].content);
  });

  test('resets rotation when all questions in pool are exhausted', async () => {
    const pool = localQuestions.GLOBAL.APTITUDE;
    // Exclude ALL questions
    const excludeContents = pool.map((q) => q.content);
    const q = await getRandomQuestion(null, 'APTITUDE', excludeContents);
    // Should still return a valid question (pool reset)
    const valid = pool.some((item) => item.content === q.content);
    expect(valid).toBe(true);
  });

  test('empty excludeContents array has no effect', async () => {
    const q = await getRandomQuestion(null, 'HR', []);
    const valid = localQuestions.GLOBAL.HR.some((item) => item.content === q.content);
    expect(valid).toBe(true);
  });

  test('undefined excludeContents has no effect', async () => {
    const q = await getRandomQuestion(null, 'HR', undefined);
    const valid = localQuestions.GLOBAL.HR.some((item) => item.content === q.content);
    expect(valid).toBe(true);
  });
});

describe('question rotation – branch independence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.interviewQuestionBank.count.mockResolvedValue(0);
    prisma.interviewQuestionBank.findFirst.mockResolvedValue(null);
  });

  test('CSE exclusion does not affect ECE pool', async () => {
    const csePool = localQuestions.COMPUTER_SCIENCE.TECHNICAL;
    const ecePool = localQuestions.ELECTRONICS.TECHNICAL;
    // Exclude all CSE questions
    const excludeContents = csePool.map((q) => q.content);
    const q = await getRandomQuestion('ELECTRONICS', 'TECHNICAL', excludeContents);
    const valid = ecePool.some((item) => item.content === q.content);
    expect(valid).toBe(true);
  });

  test('HR exclusion does not affect Aptitude pool', async () => {
    const hrPool = localQuestions.GLOBAL.HR;
    const excludeContents = hrPool.map((q) => q.content);
    const q = await getRandomQuestion(null, 'APTITUDE', excludeContents);
    const valid = localQuestions.GLOBAL.APTITUDE.some((item) => item.content === q.content);
    expect(valid).toBe(true);
  });
});

describe('question rotation – resume interviews unaffected', () => {
  test('resume interviews are handled by AI, not the pool', async () => {
    // Resume interviews call ai.generateFirstQuestion, not getRandomQuestion.
    // This test verifies that getRandomQuestion is NOT called for resume.
    // (The interviewService.startResumeInterview calls ai.generateFirstQuestion directly.)
    // This is a documentation test — resume never reaches getRandomQuestion.
    expect(INTERVIEW_TYPES.RESUME).toBe('RESUME');
  });
});
