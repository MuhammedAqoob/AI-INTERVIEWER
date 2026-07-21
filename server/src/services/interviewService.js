const prisma = require('../config/database');
const questionProvider = require('./questionProvider');
const ai = require('./ai');
const performanceService = require('./performanceService');
const { INTERVIEW_TYPES } = require('../constants/interviewTypes');
const { getStrategy } = require('./interviewStrategy');
const AppError = require('../utils/AppError');

const processing = new Set();
const DAY_LIMIT = 5;

function today() { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
function serialize(session, includeAnswers = false) {
  const base = { id: session.id, sessionId: session.id, interviewType: session.interviewType, branch: session.branch, status: session.status, questionLimit: session.questionLimit, currentQuestionNumber: session.currentQuestionNumber, currentQuestion: session.currentQuestion, difficulty: session.currentDifficulty, rollingSummary: session.rollingSummary, resumeSummary: session.resumeSummary, startedAt: session.startedAt, endedAt: session.endedAt, overallSummary: session.overallSummary, strengths: session.strengths || [], weaknesses: session.weaknesses || [], hireRecommendation: session.hireRecommendation, hireReason: session.hireReason, learningRoadmap: session.learningRoadmap || [], totalQuestions: session.answers?.length || 0 };
  if (includeAnswers) base.answers = (session.answers || []).map((a) => ({ ...a, analytics: a.analytics || {} }));
  return base;
}
async function claimDailyStart(userId) {
  const date = today();
  const usage = await prisma.dailyInterviewUsage.upsert({ where: { userId_date: { userId, date } }, create: { userId, date, interviewsStarted: 1 }, update: { interviewsStarted: { increment: 1 } } });
  if (usage.interviewsStarted > DAY_LIMIT) { await prisma.dailyInterviewUsage.update({ where: { id: usage.id }, data: { interviewsStarted: { decrement: 1 } } }); throw new AppError('Daily interview limit reached (5). Please return tomorrow.', 429); }
}
async function createSession(userId, input, firstQuestion, resumeSummary) {
  await claimDailyStart(userId);
  return prisma.interviewSession.create({ data: { userId, interviewType: input.interviewType, branch: input.branch || null, questionLimit: input.questionLimit, currentQuestion: firstQuestion, currentDifficulty: firstQuestion.difficulty, resumeSummary: resumeSummary || null } });
}
async function startInterview(userId, input) {
  if (input.interviewType === INTERVIEW_TYPES.RESUME) throw new AppError('Resume interviews require a file upload.', 400);
  const firstQuestion = await questionProvider.getRandomQuestion(input.branch, input.interviewType);
  return serialize(await createSession(userId, input, firstQuestion));
}
async function startResumeInterview(userId, input) {
  const firstQuestion = await ai.generateFirstQuestion({ interviewType: INTERVIEW_TYPES.RESUME, difficulty: 'EASY', resumeSummary: input.resumeSummary });
  return serialize(await createSession(userId, { ...input, interviewType: INTERVIEW_TYPES.RESUME }, firstQuestion, input.resumeSummary));
}
async function owned(userId, sessionId, includeAnswers = false) {
  const session = await prisma.interviewSession.findUnique({ where: { id: sessionId }, include: includeAnswers ? { answers: { orderBy: { questionNumber: 'asc' } } } : undefined });
  if (!session) throw new AppError('Interview session not found.', 404);
  if (session.userId !== userId) throw new AppError('Unauthorized access to interview session.', 403);
  return session;
}
function average(answers, type) { const keys = getStrategy(type).analytics; const totals = Object.fromEntries(keys.map((k) => [k, 0])); for (const answer of answers) for (const key of keys) totals[key] += Number(answer.analytics?.[key] || 0); return Object.fromEntries(keys.map((k) => [k, answers.length ? Math.round(totals[k] / answers.length) : 0])); }
async function finish(session, answers) { const analytics = average(answers, session.interviewType); const final = await ai.generateFinalEvaluation({ interviewType: session.interviewType, rollingSummary: session.rollingSummary, analytics, questionCount: answers.length }); return prisma.interviewSession.update({ where: { id: session.id }, data: { status: 'COMPLETED', endedAt: new Date(), currentQuestion: null, overallSummary: final.overallSummary, strengths: final.strengths, weaknesses: final.weaknesses, hireRecommendation: final.hireRecommendation, hireReason: final.hireReason, learningRoadmap: final.learningRoadmap } }); }
async function submitAnswer(userId, { sessionId, answer }) {
  if (processing.has(sessionId)) throw new AppError('Answer is already being processed.', 409); processing.add(sessionId);
  try {
    const session = await owned(userId, sessionId, true);
    if (session.status !== 'ACTIVE' || !session.currentQuestion) throw new AppError('This interview is not active.', 409);
    const turn = await ai.generateInterviewTurn({ interviewType: session.interviewType, branch: session.branch, questionNumber: session.currentQuestionNumber, questionLimit: session.questionLimit, difficulty: session.currentDifficulty, rollingSummary: session.rollingSummary, currentQuestion: session.currentQuestion.content, candidateAnswer: answer });
    // Create the immutable user-level score snapshot before the new answer is
    // saved, then add this answer once. Deleting a session never subtracts it.
    await performanceService.ensureAggregate(userId);
    const savedAnswer = await prisma.interviewAnswer.create({ data: { sessionId, questionNumber: session.currentQuestionNumber, question: session.currentQuestion.content, userAnswer: answer, betterAnswer: turn.betterAnswer, difficulty: session.currentDifficulty, analytics: turn.analytics } });
    await performanceService.recordAnswer(userId, session.interviewType, turn.analytics);
    const isFinal = session.currentQuestionNumber >= session.questionLimit;
    let updated = await prisma.interviewSession.update({ where: { id: sessionId }, data: { rollingSummary: turn.updatedSummary, currentQuestionNumber: { increment: 1 }, currentQuestion: isFinal ? null : turn.nextQuestion, currentDifficulty: isFinal ? session.currentDifficulty : turn.nextQuestion.difficulty } });
    if (isFinal) updated = await finish({ ...updated, rollingSummary: turn.updatedSummary }, [...session.answers, savedAnswer]);
    return { answer: savedAnswer, betterAnswer: turn.betterAnswer, analytics: turn.analytics, nextQuestion: updated.currentQuestion, interviewEnded: isFinal, status: updated.status, questionNumber: session.currentQuestionNumber, questionLimit: session.questionLimit, finalEvaluation: isFinal ? serialize(updated) : null };
  } finally { processing.delete(sessionId); }
}
async function pause(userId, sessionId) { const session = await owned(userId, sessionId); if (session.status === 'ACTIVE') return serialize(await prisma.interviewSession.update({ where: { id: sessionId }, data: { status: 'PAUSED' } })); return serialize(session); }
async function resume(userId, sessionId) { const session = await owned(userId, sessionId); if (session.status !== 'PAUSED') throw new AppError('Only paused interviews can be continued.', 409); return serialize(await prisma.interviewSession.update({ where: { id: sessionId }, data: { status: 'ACTIVE' } })); }
async function getSessionById(userId, id) { return serialize(await owned(userId, id, true), true); }
async function getSessionsForUser(userId) { const rows = await prisma.interviewSession.findMany({ where: { userId }, include: { answers: { select: { id: true } } }, orderBy: { updatedAt: 'desc' } }); return rows.map((s) => serialize(s)); }
async function getHistory(userId) { return getSessionsForUser(userId); }
async function deleteSession(userId, id) { await owned(userId, id); await prisma.interviewSession.delete({ where: { id } }); return { sessionId: id, deleted: true }; }
module.exports = { startInterview, startResumeInterview, submitAnswer, pause, resume, getSessionById, getSessionDetails: getSessionById, getSessionsForUser, getHistory, deleteSession };
