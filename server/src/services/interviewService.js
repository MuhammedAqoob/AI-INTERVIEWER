const prisma = require('../config/database');
const questionProvider = require('./questionProvider');
const ai = require('./ai');
const performanceService = require('./performanceService');
const { INTERVIEW_TYPES, BRANCH_REQUIRED_TYPES } = require('../constants/interviewTypes');
const { getStrategy } = require('./interviewStrategy');
const AppError = require('../utils/AppError');
const { randomUUID } = require('crypto');

const processing = new Set();
const DAY_LIMIT = 5;
const answerClaimTtl = () => Number.parseInt(process.env.ANSWER_CLAIM_TTL_MS, 10) || 90000;

function today() { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
function sessionMetrics(answers, interviewType) {
  const keys = getStrategy(interviewType).analytics;
  const values = [];
  let samples = 0;
  for (const answer of answers || []) {
    const analytics = answer.analytics || {};
    if (Object.keys(analytics).length > 0) samples += 1;
    for (const key of keys) {
      const value = Number(analytics[key]);
      if (Number.isFinite(value)) values.push(value);
    }
  }
  return { overallAverage: values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : 0, turnCount: (answers || []).length, analyticsSamples: samples };
}
function serialize(session, includeAnswers = false) {
  const metrics = sessionMetrics(session.answers, session.interviewType);
  const base = { id: session.id, sessionId: session.id, interviewType: session.interviewType, branch: session.branch, status: session.status, questionLimit: session.questionLimit, currentQuestionNumber: session.currentQuestionNumber, currentQuestion: session.currentQuestion, difficulty: session.currentDifficulty, rollingSummary: session.rollingSummary, resumeSummary: session.resumeSummary, startedAt: session.startedAt, endedAt: session.endedAt, totalQuestions: session.answers?.length || 0, overallAverage: metrics.overallAverage, turnCount: metrics.turnCount, analyticsSamples: metrics.analyticsSamples };
  if (includeAnswers) base.answers = (session.answers || []).map((a) => ({ ...a, analytics: a.analytics || {} }));
  return base;
}
async function claimDailyStart(userId) {
  const date = today();
  const usage = await prisma.dailyInterviewUsage.upsert({ where: { userId_date: { userId, date } }, create: { userId, date, interviewsStarted: 1 }, update: { interviewsStarted: { increment: 1 } } });
  if (usage.interviewsStarted > DAY_LIMIT) { await prisma.dailyInterviewUsage.update({ where: { id: usage.id }, data: { interviewsStarted: { decrement: 1 } } }); throw new AppError('Daily interview limit reached (5). Please return tomorrow.', 429); }
}
async function createSession(userId, input, firstQuestion, resumeSummary, openingQuestion) {
  await claimDailyStart(userId);
  return prisma.interviewSession.create({ data: { userId, interviewType: input.interviewType, branch: input.branch || null, questionLimit: input.questionLimit, currentQuestion: firstQuestion, currentDifficulty: firstQuestion.difficulty, resumeSummary: resumeSummary || null, openingQuestionContent: openingQuestion?.content || null, openingQuestionDifficulty: openingQuestion?.difficulty || null } });
}
async function getUsedOpeningQuestions(userId, interviewType, branch) {
  const where = { userId, interviewType, status: 'COMPLETED', openingQuestionContent: { not: null } };
  if (BRANCH_REQUIRED_TYPES.includes(interviewType)) where.branch = branch;
  else where.branch = null;
  const rows = await prisma.interviewSession.findMany({ where, select: { openingQuestionContent: true }, distinct: ['openingQuestionContent'] });
  return rows.map((r) => r.openingQuestionContent).filter(Boolean);
}

async function startInterview(userId, input) {
  if (input.interviewType === INTERVIEW_TYPES.RESUME) throw new AppError('Resume interviews require a file upload.', 400);
  const usedContents = await getUsedOpeningQuestions(userId, input.interviewType, input.branch || null);
  const firstQuestion = await questionProvider.getRandomQuestion(input.branch, input.interviewType, usedContents);
  return serialize(await createSession(userId, input, firstQuestion, null, firstQuestion));
}
async function startResumeInterview(userId, input) {
  const firstQuestion = await ai.generateFirstQuestion({ interviewType: INTERVIEW_TYPES.RESUME, difficulty: 'EASY', resumeSummary: input.resumeSummary });
  return serialize(await createSession(userId, { ...input, interviewType: INTERVIEW_TYPES.RESUME }, firstQuestion, input.resumeSummary));
}

async function retakeInterview(userId, sessionId) {
  const original = await owned(userId, sessionId);
  if (original.interviewType === INTERVIEW_TYPES.RESUME) throw new AppError('Resume interviews generate new AI questions on retake. Use start-resume instead.', 400);
  if (!original.openingQuestionContent) throw new AppError('This session does not have a trackable opening question for retake.', 400);
  const firstQuestion = { content: original.openingQuestionContent, difficulty: original.openingQuestionDifficulty || 'EASY' };
  const input = { interviewType: original.interviewType, branch: original.branch, questionLimit: original.questionLimit };
  return serialize(await createSession(userId, input, firstQuestion, null, firstQuestion));
}

async function owned(userId, sessionId, includeAnswers = false) {
  const session = await prisma.interviewSession.findUnique({ where: { id: sessionId }, include: includeAnswers ? { answers: { orderBy: { questionNumber: 'asc' } } } : undefined });
  if (!session) throw new AppError('Interview session not found.', 404);
  if (session.userId !== userId) throw new AppError('Unauthorized access to interview session.', 403);
  return session;
}
async function claimAnswer(userId, session) {
  const token = randomUUID();
  const staleBefore = new Date(Date.now() - answerClaimTtl());
  const claim = await prisma.interviewSession.updateMany({
    where: {
      id: session.id,
      userId,
      status: 'ACTIVE',
      currentQuestionNumber: session.currentQuestionNumber,
      revision: session.revision || 0,
      OR: [{ answerClaimToken: null }, { answerClaimedAt: { lte: staleBefore } }],
    },
    data: { answerClaimToken: token, answerClaimedAt: new Date(), revision: { increment: 1 } },
  });
  if (claim.count !== 1) throw new AppError('This interview question is already being processed or has changed. Please refresh and try again.', 409);
  return { token, revision: (session.revision || 0) + 1 };
}

async function releaseAnswerClaim(sessionId, token) {
  await prisma.interviewSession.updateMany({
    where: { id: sessionId, answerClaimToken: token },
    data: { answerClaimToken: null, answerClaimedAt: null, revision: { increment: 1 } },
  });
}

async function submitAnswer(userId, { sessionId, answer }) {
  if (processing.has(sessionId)) throw new AppError('Answer is already being processed.', 409);
  processing.add(sessionId);
  let claim;
  try {
    const session = await owned(userId, sessionId, true);
    if (session.status !== 'ACTIVE' || !session.currentQuestion) throw new AppError('This interview is not active.', 409);
    // Claim the exact question/version before any external AI work. The claim
    // is short-lived and is also enforced again in the final DB transaction.
    claim = await claimAnswer(userId, session);
    await performanceService.ensureAggregate(userId);
    const turn = await ai.generateInterviewTurn({ interviewType: session.interviewType, branch: session.branch, questionNumber: session.currentQuestionNumber, questionLimit: session.questionLimit, difficulty: session.currentDifficulty, rollingSummary: session.rollingSummary, currentQuestion: session.currentQuestion.content, candidateAnswer: answer });
    const isFinal = session.currentQuestionNumber >= session.questionLimit;
    const [savedAnswer, updated] = await prisma.$transaction(async (tx) => {
      const saved = await tx.interviewAnswer.create({ data: { sessionId, questionNumber: session.currentQuestionNumber, question: session.currentQuestion.content, userAnswer: answer, betterAnswer: turn.betterAnswer, difficulty: session.currentDifficulty, analytics: turn.analytics } });
      const sessionUpdate = await tx.interviewSession.updateMany({
        where: { id: sessionId, userId, status: 'ACTIVE', currentQuestionNumber: session.currentQuestionNumber, revision: claim.revision, answerClaimToken: claim.token },
        data: isFinal
          ? { status: 'COMPLETED', endedAt: new Date(), currentQuestion: null, rollingSummary: turn.updatedSummary, answerClaimToken: null, answerClaimedAt: null, revision: { increment: 1 } }
          : { rollingSummary: turn.updatedSummary, currentQuestionNumber: { increment: 1 }, currentQuestion: turn.nextQuestion, currentDifficulty: turn.nextQuestion.difficulty, answerClaimToken: null, answerClaimedAt: null, revision: { increment: 1 } },
      });
      if (sessionUpdate.count !== 1) throw new AppError('Interview session changed while this answer was being processed.', 409);
      const updated = await tx.interviewSession.findUnique({ where: { id: sessionId } });
      if (isFinal) {
        // The interview only counts toward the leaderboard once it is COMPLETED.
        // All of the session's answers are applied as one per-criterion sample
        // (the session average) in a single aggregate update.
        await performanceService.recordSession(userId, session.interviewType, [...session.answers.map((a) => a.analytics), saved.analytics], tx);
      }
      return [saved, updated];
    });
    claim = null;
    await performanceService.invalidateLeaderboard();
    const responseFinal = isFinal ? serialize({ ...updated, answers: [...session.answers, savedAnswer] }) : null;
    return { answer: savedAnswer, betterAnswer: turn.betterAnswer, analytics: turn.analytics, nextQuestion: updated.currentQuestion, interviewEnded: isFinal, status: updated.status, questionNumber: session.currentQuestionNumber, questionLimit: session.questionLimit, finalEvaluation: responseFinal };
  } catch (error) {
    if (claim) await releaseAnswerClaim(sessionId, claim.token).catch(() => undefined);
    throw error;
  } finally { processing.delete(sessionId); }
}
async function pause(userId, sessionId) {
  const session = await owned(userId, sessionId, true);
  if (session.status === 'ACTIVE') {
    const result = await prisma.interviewSession.updateMany({ where: { id: sessionId, userId, status: 'ACTIVE', revision: session.revision || 0, answerClaimToken: null }, data: { status: 'PAUSED', revision: { increment: 1 } } });
    if (result.count !== 1) throw new AppError('Interview state changed or an answer is being processed.', 409);
    return serialize(await owned(userId, sessionId, true), true);
  }
  return serialize(session, true);
}

async function resume(userId, sessionId) {
  const session = await owned(userId, sessionId, true);
  if (session.status === 'ACTIVE') {
    return serialize(session, true);
  }
  if (session.status !== 'PAUSED') {
    throw new AppError('Only paused interviews can be continued.', 409);
  }
  const result = await prisma.interviewSession.updateMany({ where: { id: sessionId, userId, status: 'PAUSED', revision: session.revision || 0, answerClaimToken: null }, data: { status: 'ACTIVE', revision: { increment: 1 } } });
  if (result.count !== 1) throw new AppError('Interview state changed. Please refresh and try again.', 409);
  return serialize(await owned(userId, sessionId, true), true);
}

async function endSession(userId, sessionId) {
  const session = await owned(userId, sessionId, true);
  if (session.status === 'COMPLETED') {
    return serialize(session, true);
  }
  if (session.status !== 'ACTIVE' && session.status !== 'PAUSED') {
    throw new AppError('Only active or paused interviews can be completed.', 409);
  }
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.interviewSession.updateMany({
      where: { id: sessionId, userId, status: { in: ['ACTIVE', 'PAUSED'] }, revision: session.revision || 0, answerClaimToken: null },
      data: { status: 'COMPLETED', endedAt: new Date(), currentQuestion: null, revision: { increment: 1 } },
    });
    if (result.count !== 1) throw new AppError('Interview state changed or an answer is being processed.', 409);
    const answers = session.answers || [];
    if (answers.length) {
      // A force-completed interview contributes its session average to the
      // leaderboard exactly once, committed together with the status change.
      await performanceService.recordSession(userId, session.interviewType, answers.map((a) => a.analytics), tx);
    }
    return tx.interviewSession.findUnique({ where: { id: sessionId } });
  });
  await performanceService.invalidateLeaderboard();
  return serialize({ ...updated, answers: session.answers || [] }, true);
}

async function getSessionById(userId, id) {
  const session = await owned(userId, id, true);
  const result = serialize(session, true);
  if (session.status === 'COMPLETED') {
    result.scoreContribution = await performanceService.sessionContribution(userId, id);
  }
  return result;
}
async function getSessionsForUser(userId) { const rows = await prisma.interviewSession.findMany({ where: { userId }, include: { answers: { select: { id: true, analytics: true } } }, orderBy: { updatedAt: 'desc' } }); return rows.map((s) => serialize(s)); }
async function getHistory(userId) { return getSessionsForUser(userId); }
async function deleteSession(userId, id) { await owned(userId, id); await prisma.interviewSession.delete({ where: { id } }); return { sessionId: id, deleted: true }; }
module.exports = { startInterview, startResumeInterview, retakeInterview, submitAnswer, pause, resume, endSession, getSessionById, getSessionDetails: getSessionById, getSessionsForUser, getHistory, deleteSession };
