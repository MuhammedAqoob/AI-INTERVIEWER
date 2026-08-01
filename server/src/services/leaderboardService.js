const prisma = require('../config/database');
const performanceService = require('./performanceService');
const { getJSON, setJSON } = require('../lib/redis/cache');

async function getUserLeaderboardScore(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true } });
  if (!user) return null;
  const score = performanceService.snapshot(await performanceService.ensureAggregate(userId));
  return score.criteriaCovered ? { userId, username: user.username, ...score } : null;
}

async function getLeaderboard(limit = 10) {
  // Cache each page size separately so the truncated top-10 result is never
  // served as a "top 50". A performance update invalidates the whole
  // 'leaderboard:global:*' family via delByPattern.
  const CACHE_KEY = `leaderboard:global:${limit}`;

  // Try cache first – log only in development.
  const cached = await getJSON(CACHE_KEY);
  if (cached) {
    if (process.env.NODE_ENV !== 'production') console.log(`CACHE HIT ${CACHE_KEY}`);
    return cached;
  }
  if (process.env.NODE_ENV !== 'production') console.log(`CACHE MISS ${CACHE_KEY}`);

  const rows = await prisma.userPerformanceAggregate.findMany({ include: { user: { select: { username: true } } } });
  const result = rows
    .map((row) => ({ userId: row.userId, username: row.user.username, ...performanceService.snapshot(row) }))
    .filter((row) => row.criteriaCovered > 0)
    .sort((a, b) => b.averageScore - a.averageScore || b.criteriaCovered - a.criteriaCovered || b.totalAnswers - a.totalAnswers || a.username.localeCompare(b.username))
    .slice(0, limit)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  // Store for 5 minutes (300 seconds). Errors are silent – a miss on the next request will rebuild.
  await setJSON(CACHE_KEY, result, 300);
  return result;
}

module.exports = { getUserLeaderboardScore, getLeaderboard };
