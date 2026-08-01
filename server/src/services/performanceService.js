const prisma = require('../config/database');
const { STRATEGIES, CORE_TYPES, CORE_METRICS } = require('./interviewStrategy');
const { INTERVIEW_TYPES } = require('../constants/interviewTypes');
const { delByPattern } = require('../lib/redis/cache');

const blank = () => Object.fromEntries(CORE_METRICS.map((key) => [key, 0]));
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const round = (value) => Math.round(value * 100) / 100;

function normalizeAggregate(row = {}) {
  return { coreSums: { ...blank(), ...(row.coreSums || {}) }, coreCounts: { ...blank(), ...(row.coreCounts || {}) }, resumeHighScores: { ...blank(), ...(row.resumeHighScores || {}) }, totalAnswers: row.totalAnswers || 0 };
}

function applyAnswer(state, interviewType, analytics) {
  const next = normalizeAggregate(state);
  next.totalAnswers += 1;
  if (interviewType === INTERVIEW_TYPES.RESUME) {
    for (const key of CORE_METRICS) next.resumeHighScores[key] = Math.max(number(next.resumeHighScores[key]), number(analytics?.[key]));
    return next;
  }
  for (const key of STRATEGIES[interviewType]?.analytics || []) {
    next.coreSums[key] += number(analytics?.[key]);
    next.coreCounts[key] += 1;
  }
  return next;
}

function snapshot(row) {
  const aggregate = normalizeAggregate(row);
  const criterionScores = Object.fromEntries(CORE_METRICS.map((key) => {
    const base = aggregate.coreCounts[key] ? aggregate.coreSums[key] / aggregate.coreCounts[key] : 0;
    return [key, round(base ? Math.max(base, aggregate.resumeHighScores[key]) : 0)];
  }));
  const coveredKeys = CORE_METRICS.filter((key) => aggregate.coreCounts[key] > 0);
  const categoryScores = Object.fromEntries(CORE_TYPES.map((type) => {
    const coveredInType = STRATEGIES[type].analytics.filter((key) => aggregate.coreCounts[key] > 0);
    return [type, coveredInType.length ? round(coveredInType.reduce((sum, key) => sum + criterionScores[key], 0) / coveredInType.length) : null];
  }));
  return { criterionScores, categoryScores, criteriaCovered: coveredKeys.length, averageScore: coveredKeys.length ? round(coveredKeys.reduce((sum, key) => sum + criterionScores[key], 0) / coveredKeys.length) : 0, totalAnswers: aggregate.totalAnswers };
}

async function createFromExisting(userId) {
  const answers = await prisma.interviewAnswer.findMany({ where: { session: { userId } }, select: { analytics: true, session: { select: { interviewType: true } } } });
  const aggregate = answers.reduce((state, answer) => applyAnswer(state, answer.session.interviewType, answer.analytics), normalizeAggregate());
  return prisma.userPerformanceAggregate.create({ data: { userId, ...aggregate } });
}

async function ensureAggregate(userId) {
  const existing = await prisma.userPerformanceAggregate.findUnique({ where: { userId } });
  if (existing) return existing;
  try { return await createFromExisting(userId); }
  catch (error) { if (error.code === 'P2002') return prisma.userPerformanceAggregate.findUnique({ where: { userId } }); throw error; }
}

async function invalidateLeaderboard() {
  // Invalidate all cached leaderboards (every page size) because the user's
  // performance has changed. Guarded so a Redis failure can never break the
  // answer-write path.
  try {
    await delByPattern('leaderboard:global:*');
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('Failed to invalidate leaderboard cache:', err);
  }
}

// Compare-and-swap on the aggregate revision makes the read/calculate/write
// sequence safe across requests and Node processes. The caller can pass an
// existing Prisma transaction so the answer, session transition and aggregate
// update commit or roll back together.
async function recordAnswer(userId, interviewType, analytics, tx = null) {
  const client = tx || prisma;
  const maxAttempts = 8;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const current = await client.userPerformanceAggregate.findUnique({ where: { userId } }) || await ensureAggregate(userId);
    const next = applyAnswer(current, interviewType, analytics);
    const updated = await client.userPerformanceAggregate.updateMany({
      where: { userId, revision: current.revision || 0 },
      data: { ...next, revision: { increment: 1 } },
    });
    if (updated.count === 1) {
      const result = { ...current, ...next, revision: (current.revision || 0) + 1 };
      if (!tx) await invalidateLeaderboard();
      return result;
    }
  }
  throw new Error('Performance aggregate changed too frequently. Please retry.');
}

async function backfillAll() {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const user of users) await ensureAggregate(user.id);
}

module.exports = { ensureAggregate, recordAnswer, invalidateLeaderboard, snapshot, backfillAll };
