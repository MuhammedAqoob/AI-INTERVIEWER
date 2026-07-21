const prisma = require('../config/database');
const performanceService = require('./performanceService');

async function getUserLeaderboardScore(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true } });
  if (!user) return null;
  const score = performanceService.snapshot(await performanceService.ensureAggregate(userId));
  return score.criteriaCovered ? { userId, username: user.username, ...score } : null;
}

async function getLeaderboard(limit = 10) {
  const rows = await prisma.userPerformanceAggregate.findMany({ include: { user: { select: { username: true } } } });
  return rows.map((row) => ({ userId: row.userId, username: row.user.username, ...performanceService.snapshot(row) })).filter((row) => row.criteriaCovered > 0).sort((a, b) => b.averageScore - a.averageScore || b.criteriaCovered - a.criteriaCovered || b.totalAnswers - a.totalAnswers || a.username.localeCompare(b.username)).slice(0, limit).map((row, index) => ({ ...row, rank: index + 1 }));
}

module.exports = { getUserLeaderboardScore, getLeaderboard };
