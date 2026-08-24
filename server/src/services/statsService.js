const prisma = require('../config/database');
const performanceService = require('./performanceService');
const { INTERVIEW_TYPES } = require('../constants/interviewTypes');
const { CORE_TYPES, STRATEGIES } = require('./interviewStrategy');

function dateToday() { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }

function groupedAnalytics(score) {
  return Object.fromEntries(CORE_TYPES.map((type) => [type, Object.fromEntries(STRATEGIES[type].analytics.map((key) => [key, score.criterionScores[key]]))]));
}

async function getDashboardSummary(userId) {
  const [sessions, usage, aggregate] = await Promise.all([prisma.interviewSession.findMany({ where: { userId }, select: { id: true, interviewType: true, status: true, updatedAt: true } }), prisma.dailyInterviewUsage.findUnique({ where: { userId_date: { userId, date: dateToday() } } }), performanceService.ensureAggregate(userId)]);
  const counts = { technical: 0, hr: 0, aptitude: 0, resume: 0 }; for (const s of sessions) { if (s.interviewType === INTERVIEW_TYPES.TECHNICAL) counts.technical++; if (s.interviewType === INTERVIEW_TYPES.HR) counts.hr++; if (s.interviewType === INTERVIEW_TYPES.APTITUDE) counts.aptitude++; if (s.interviewType === INTERVIEW_TYPES.RESUME) counts.resume++; }
  const paused = sessions.filter((s) => s.status === 'PAUSED').sort((a, b) => b.updatedAt - a.updatedAt)[0];
  const score = performanceService.snapshot(aggregate);
  const leaderboardEligibleSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
  // Analytics are persistent user performance, not a view of deletable sessions.
  return { interviewsRemainingToday: Math.max(0, 5 - (usage?.interviewsStarted || 0)), totalSessions: sessions.length, completedInterviews: sessions.filter((s) => s.status === 'COMPLETED').length, leaderboardEligibleSessions, interviewCounts: counts, continueSessionId: paused?.id || null, analytics: groupedAnalytics(score), averageScore: score.averageScore, categoryScores: score.categoryScores };
}
module.exports = { getDashboardSummary };
