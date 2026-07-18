const prisma = require('../config/database');
const questionProvider = require('./questionProvider');
const aiProvider = require('./ai');
const statsService = require('./statsService');
const { SESSION_STATUS } = require('../constants/sessionStatus');
const { INTERVIEW_TYPES, RESUME_SUPPORTED_TYPES } = require('../constants/interviewTypes');
const { DIFFICULTY } = require('../constants/difficulty');
const AppError = require('../utils/AppError');

const SESSION_EXPIRY_HOURS = 24;
const MAX_QUESTIONS = parseInt(process.env.MAX_INTERVIEW_QUESTIONS, 10) || 10;
const MAX_ACTIVE_SESSIONS = 5;
const DEFAULT_DIFFICULTY = DIFFICULTY.EASY;

const processingSessions = new Map();

function getExpiryDate() {
  const now = new Date();
  return new Date(now.getTime() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
}

function isExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

function serializeSession(session) {
  return {
    sessionId: session.id,
    interviewType: session.interviewType,
    branch: session.branch,
    conversation: Array.isArray(session.conversation) ? session.conversation : [],
    currentQuestion: session.currentQuestion || null,
    difficulty: session.difficulty,
    accumulatedScore: session.accumulatedScore,
    totalQuestions: session.totalQuestions,
    lifeConsumed: session.lifeConsumed,
    resumeSummary: session.resumeSummary || null,
    status: session.status,
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
  };
}

async function countActiveSessions(userId) {
  const now = new Date();
  const count = await prisma.interviewSession.count({
    where: {
      userId,
      status: SESSION_STATUS.ACTIVE,
      expiresAt: { gt: now },
    },
  });
  return count;
}

async function findActiveSession(userId, interviewType, branch) {
  const where = {
    userId,
    interviewType,
    status: SESSION_STATUS.ACTIVE,
  };

  if (branch) {
    where.branch = branch;
  } else {
    where.branch = null;
  }

  const session = await prisma.interviewSession.findFirst({
    where,
    orderBy: { startedAt: 'desc' },
  });

  if (!session) return null;

  if (isExpired(session.expiresAt)) {
    await prisma.interviewSession.update({
      where: { id: session.id },
      data: { status: SESSION_STATUS.EXPIRED },
    });
    return null;
  }

  return session;
}

async function startInterview(userId, { interviewType, branch, difficulty }) {
  const existingSession = await findActiveSession(userId, interviewType, branch);

  if (existingSession) {
    const conversation = Array.isArray(existingSession.conversation)
      ? existingSession.conversation
      : [];

    return {
      sessionId: existingSession.id,
      interviewType: existingSession.interviewType,
      branch: existingSession.branch,
      conversation,
      currentQuestion: existingSession.currentQuestion,
      difficulty: existingSession.difficulty,
      accumulatedScore: existingSession.accumulatedScore,
      totalQuestions: existingSession.totalQuestions,
      lifeConsumed: existingSession.lifeConsumed,
      resumeSummary: existingSession.resumeSummary || null,
      isResumed: true,
      expiresAt: existingSession.expiresAt,
    };
  }

  const activeCount = await countActiveSessions(userId);
  if (activeCount >= MAX_ACTIVE_SESSIONS) {
    throw new AppError(
      'Maximum active interview sessions reached. Delete or finish an existing session.',
      409
    );
  }

  const selectedDifficulty = difficulty || DEFAULT_DIFFICULTY;
  const firstQuestion = questionProvider.getRandomQuestion(branch, interviewType);

  const session = await prisma.interviewSession.create({
    data: {
      userId,
      branch: branch || null,
      interviewType,
      status: SESSION_STATUS.ACTIVE,
      difficulty: firstQuestion.difficulty || selectedDifficulty,
      conversation: [
        { role: 'assistant', content: firstQuestion.content },
      ],
      currentQuestion: firstQuestion,
      accumulatedScore: 0,
      totalQuestions: 1,
      lifeConsumed: false,
      expiresAt: getExpiryDate(),
    },
  });

  return {
    sessionId: session.id,
    interviewType,
    branch: branch || null,
    conversation: session.conversation,
    currentQuestion: session.currentQuestion,
    difficulty: session.difficulty,
    accumulatedScore: 0,
    totalQuestions: 1,
    lifeConsumed: false,
    resumeSummary: null,
    isResumed: false,
    expiresAt: session.expiresAt,
  };
}

async function startResumeInterview(userId, { difficulty, resumeSummary }) {
  const existingActive = await prisma.interviewSession.findFirst({
    where: {
      userId,
      interviewType: INTERVIEW_TYPES.RESUME,
      status: SESSION_STATUS.ACTIVE,
    },
    orderBy: { startedAt: 'desc' },
  });

  if (existingActive && !isExpired(existingActive.expiresAt)) {
    const conversation = Array.isArray(existingActive.conversation)
      ? existingActive.conversation
      : [];

    return {
      sessionId: existingActive.id,
      interviewType: existingActive.interviewType,
      branch: null,
      conversation,
      currentQuestion: existingActive.currentQuestion,
      difficulty: existingActive.difficulty,
      accumulatedScore: existingActive.accumulatedScore,
      totalQuestions: existingActive.totalQuestions,
      lifeConsumed: existingActive.lifeConsumed,
      resumeSummary: existingActive.resumeSummary || null,
      isResumed: true,
      expiresAt: existingActive.expiresAt,
    };
  }

  const activeCount = await countActiveSessions(userId);
  if (activeCount >= MAX_ACTIVE_SESSIONS) {
    throw new AppError(
      'Maximum active interview sessions reached. Delete or finish an existing session.',
      409
    );
  }

  const selectedDifficulty = difficulty || DEFAULT_DIFFICULTY;

  const firstQuestion = await aiProvider.generateFirstQuestion({
    interviewType: INTERVIEW_TYPES.RESUME,
    difficulty: selectedDifficulty,
    resumeSummary,
  });

  const session = await prisma.interviewSession.create({
    data: {
      userId,
      branch: null,
      interviewType: INTERVIEW_TYPES.RESUME,
      status: SESSION_STATUS.ACTIVE,
      difficulty: firstQuestion.difficulty || selectedDifficulty,
      conversation: [
        { role: 'assistant', content: firstQuestion.content },
      ],
      currentQuestion: firstQuestion,
      accumulatedScore: 0,
      totalQuestions: 1,
      lifeConsumed: false,
      resumeSummary,
      expiresAt: getExpiryDate(),
    },
  });

  return {
    sessionId: session.id,
    interviewType: INTERVIEW_TYPES.RESUME,
    branch: null,
    conversation: session.conversation,
    currentQuestion: session.currentQuestion,
    difficulty: session.difficulty,
    accumulatedScore: 0,
    totalQuestions: 1,
    lifeConsumed: false,
    resumeSummary,
    isResumed: false,
    expiresAt: session.expiresAt,
  };
}

async function submitAnswer(userId, { sessionId, answer }) {
  if (processingSessions.get(sessionId)) {
    throw new AppError('Answer is already being processed. Please wait.', 409);
  }

  processingSessions.set(sessionId, true);

  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new AppError('Interview session not found.', 404);
    }

    if (session.userId !== userId) {
      throw new AppError('Unauthorized access to interview session.', 403);
    }

    if (session.status !== SESSION_STATUS.ACTIVE) {
      throw new AppError('Interview session is no longer active.', 410);
    }

    if (isExpired(session.expiresAt)) {
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: SESSION_STATUS.EXPIRED },
      });
      throw new AppError('Interview session has expired. Please start a new one.', 410);
    }

    const lifeResult = await statsService.consumeLife(userId);

    const conversation = Array.isArray(session.conversation) ? [...session.conversation] : [];
    conversation.push({ role: 'user', content: answer });

    const aiResult = await aiProvider.generateInterviewTurn({
      branch: session.branch,
      interviewType: session.interviewType,
      conversationHistory: conversation,
      difficulty: session.difficulty,
      resumeSummary: session.resumeSummary || undefined,
    });

    const newAccumulatedScore = session.accumulatedScore + aiResult.evaluation.score;
    const newTotalQuestions = session.totalQuestions + 1;

    const sessionEnded = aiResult.shouldEnd || newTotalQuestions > MAX_QUESTIONS;

    if (sessionEnded) {
      conversation.push({ role: 'assistant', content: 'Interview complete. Thank you for participating.' });

      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: SESSION_STATUS.COMPLETED,
          conversation,
          accumulatedScore: newAccumulatedScore,
          totalQuestions: newTotalQuestions,
          lifeConsumed: true,
          endedAt: new Date(),
        },
      });

      await statsService.calculateStreak(userId);
      await statsService.incrementTotalInterviews(userId);

      return {
        evaluation: aiResult.evaluation,
        nextQuestion: null,
        totalQuestions: newTotalQuestions,
        currentScore: newAccumulatedScore,
        sessionStatus: SESSION_STATUS.COMPLETED,
        lifeConsumed: true,
      };
    }

    if (!lifeResult.success) {
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          conversation,
          accumulatedScore: newAccumulatedScore,
          totalQuestions: newTotalQuestions,
          lifeConsumed: true,
        },
      });

      return {
        evaluation: aiResult.evaluation,
        nextQuestion: null,
        totalQuestions: newTotalQuestions,
        currentScore: newAccumulatedScore,
        sessionStatus: SESSION_STATUS.ACTIVE,
        lifeConsumed: true,
        interviewEnded: true,
        reason: 'NO_LIVES',
      };
    }

    if (aiResult.nextQuestion) {
      conversation.push({ role: 'assistant', content: aiResult.nextQuestion.content });
    }

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        conversation,
        currentQuestion: aiResult.nextQuestion,
        difficulty: aiResult.nextQuestion ? aiResult.nextQuestion.difficulty : session.difficulty,
        accumulatedScore: newAccumulatedScore,
        totalQuestions: newTotalQuestions,
        lifeConsumed: true,
        expiresAt: getExpiryDate(),
      },
    });

    return {
      evaluation: aiResult.evaluation,
      nextQuestion: aiResult.nextQuestion,
      totalQuestions: newTotalQuestions,
      currentScore: newAccumulatedScore,
      sessionStatus: SESSION_STATUS.ACTIVE,
      lifeConsumed: true,
    };
  } finally {
    processingSessions.delete(sessionId);
  }
}

async function endInterview(userId, sessionId) {
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new AppError('Interview session not found.', 404);
  }

  if (session.userId !== userId) {
    throw new AppError('Unauthorized access to interview session.', 403);
  }

  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      status: SESSION_STATUS.COMPLETED,
      endedAt: new Date(),
    },
  });

  if (session.lifeConsumed) {
    await statsService.calculateStreak(userId);
    await statsService.incrementTotalInterviews(userId);
  }

  return {
    sessionId,
    totalQuestions: session.totalQuestions,
    finalScore: session.accumulatedScore,
    averageScore: session.totalQuestions > 0
      ? parseFloat((session.accumulatedScore / session.totalQuestions).toFixed(1))
      : 0,
    status: SESSION_STATUS.COMPLETED,
  };
}

async function refreshInterview(userId, { interviewType, branch, difficulty }) {
  const activeSession = await findActiveSession(userId, interviewType, branch);

  if (activeSession) {
    await prisma.interviewSession.update({
      where: { id: activeSession.id },
      data: { status: SESSION_STATUS.EXPIRED },
    });
  }

  const activeCount = await countActiveSessions(userId);
  if (activeCount >= MAX_ACTIVE_SESSIONS) {
    throw new AppError(
      'Maximum active interview sessions reached. Delete or finish an existing session.',
      409
    );
  }

  const selectedDifficulty = difficulty || DEFAULT_DIFFICULTY;
  const firstQuestion = questionProvider.getRandomQuestion(branch, interviewType);

  const session = await prisma.interviewSession.create({
    data: {
      userId,
      branch: branch || null,
      interviewType,
      status: SESSION_STATUS.ACTIVE,
      difficulty: firstQuestion.difficulty || selectedDifficulty,
      conversation: [
        { role: 'assistant', content: firstQuestion.content },
      ],
      currentQuestion: firstQuestion,
      accumulatedScore: 0,
      totalQuestions: 1,
      lifeConsumed: false,
      expiresAt: getExpiryDate(),
    },
  });

  return {
    sessionId: session.id,
    interviewType,
    branch: branch || null,
    conversation: session.conversation,
    currentQuestion: session.currentQuestion,
    difficulty: session.difficulty,
    accumulatedScore: 0,
    totalQuestions: 1,
    lifeConsumed: false,
    resumeSummary: null,
    expiresAt: session.expiresAt,
  };
}

async function getSessionById(userId, sessionId) {
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new AppError('Interview session not found.', 404);
  }

  if (session.userId !== userId) {
    throw new AppError('Unauthorized access to interview session.', 403);
  }

  if (session.status !== SESSION_STATUS.ACTIVE) {
    throw new AppError('Interview session is no longer active.', 410);
  }

  if (isExpired(session.expiresAt)) {
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status: SESSION_STATUS.EXPIRED },
    });
    throw new AppError('Interview session has expired.', 410);
  }

  return serializeSession(session);
}

async function getActiveSessionsForUser(userId) {
  const sessions = await prisma.interviewSession.findMany({
    where: { userId, status: SESSION_STATUS.ACTIVE },
    orderBy: { startedAt: 'desc' },
  });

  const active = [];
  for (const session of sessions) {
    if (!isExpired(session.expiresAt)) {
      active.push(serializeSession(session));
    } else {
      await prisma.interviewSession.update({
        where: { id: session.id },
        data: { status: SESSION_STATUS.EXPIRED },
      });
    }
  }

  return active;
}

module.exports = {
  startInterview,
  startResumeInterview,
  submitAnswer,
  endInterview,
  refreshInterview,
  getSessionById,
  getActiveSessionsForUser,
};
