const prisma = require('../config/database');
const { STRATEGIES, CORE_TYPES, CORE_METRICS } = require('./interviewStrategy');
const { INTERVIEW_TYPES } = require('../constants/interviewTypes');
const { delByPattern } = require('../lib/redis/cache');

const blank = () => Object.fromEntries(CORE_METRICS.map((key) => [key, 0]));
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const round = (value) => Math.round(value * 100) / 100;
const EMA_ALPHA = 0.35;

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
    applyEmaMetric(next, key, number(analytics?.[key]));
  }
  return next;
}

// coreSums/coreCounts keep the existing database shape. Once a metric has a
// value, coreSums stores its EMA and coreCounts stays at one as its coverage
// marker, so snapshot() continues to calculate the score the same way.
function applyEmaMetric(aggregate, key, sessionMetric) {
  const count = number(aggregate.coreCounts[key]);
  const previousMetric = count > 0 ? number(aggregate.coreSums[key]) / count : null;
  aggregate.coreSums[key] = previousMetric === null
    ? sessionMetric
    : round((EMA_ALPHA * sessionMetric) + ((1 - EMA_ALPHA) * previousMetric));
  aggregate.coreCounts[key] = 1;
}

function sessionAverages(analyticsList, keys) {
  const sums = {};
  const counts = {};
  for (const analytics of analyticsList || []) {
    if (!analytics) continue;
    for (const key of keys) {
      if (analytics[key] == null) continue;
      sums[key] = (sums[key] || 0) + number(analytics[key]);
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  return Object.fromEntries(keys.filter((key) => counts[key]).map((key) => [key, round(sums[key] / counts[key])]));
}

// A completed interview contributes exactly one per-criterion session average.
// Each new session metric updates the existing aggregate with EMA, giving the
// latest completed interview a 35% weight. Resume sessions retain their
// existing bonus/high-score behaviour.
function applySession(state, interviewType, answers) {
  const next = normalizeAggregate(state);
  const analyticsList = (answers || []).map((answer) => answer?.analytics ?? answer).filter((a) => a && typeof a === 'object');
  next.totalAnswers += analyticsList.length;
  if (interviewType === INTERVIEW_TYPES.RESUME) {
    for (const key of CORE_METRICS) {
      const high = analyticsList.reduce((max, analytics) => Math.max(max, number(analytics[key])), 0);
      if (high > 0) next.resumeHighScores[key] = Math.max(number(next.resumeHighScores[key]), high);
    }
    return next;
  }
  const keys = STRATEGIES[interviewType]?.analytics || [];
  const averages = sessionAverages(analyticsList, keys);
  for (const key of keys) {
    if (averages[key] === undefined) continue;
    applyEmaMetric(next, key, averages[key]);
  }
  return next;
}

// Builds an aggregate from stored answers by grouping them per session, so
// each completed interview contributes a single per-criterion sample.
function aggregateFromAnswers(answers) {
  const groups = new Map();
  for (const answer of answers || []) {
    if (!groups.has(answer.sessionId)) groups.set(answer.sessionId, []);
    groups.get(answer.sessionId).push(answer);
  }
  return [...groups.values()]
    .sort((a, b) => new Date(a[0].session?.endedAt || a[0].createdAt || 0) - new Date(b[0].session?.endedAt || b[0].createdAt || 0))
    .reduce((state, rows) => applySession(state, rows[0].session.interviewType, rows), normalizeAggregate());
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
  const answers = await prisma.interviewAnswer.findMany({ where: { session: { userId, status: 'COMPLETED' } }, select: { sessionId: true, createdAt: true, analytics: true, session: { select: { interviewType: true, endedAt: true } } } });
  const aggregate = aggregateFromAnswers(answers);
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

// Same compare-and-swap update as recordAnswer, but it applies a completed
// interview as a single per-criterion sample (its session average) instead of
// one sample per answer. It should only be called once the interview is
// COMPLETED (final turn or the user force-completing it).
async function recordSession(userId, interviewType, answers, tx = null) {
  const client = tx || prisma;
  const maxAttempts = 8;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const current = await client.userPerformanceAggregate.findUnique({ where: { userId } }) || await ensureAggregate(userId);
    const next = applySession(current, interviewType, answers);
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

// The "without this session" baseline is derived by removing the session's own
// contribution from the current aggregate rather than by re-aggregating stored
// answers. This keeps the contribution exactly equal to the leaderboard delta
// the user saw when the interview completed, and stays correct even if older
// sessions are deleted afterwards (analytics are persistent, sessions are not).
function recomputeResumeHighScores(others) {
  const high = blank();
  const groups = {};
  for (const answer of others || []) {
    (groups[answer.sessionId] || (groups[answer.sessionId] = [])).push(answer);
  }
  for (const rows of Object.values(groups)) {
    for (const key of CORE_METRICS) {
      const sessionHigh = rows.reduce((max, row) => Math.max(max, number(row.analytics?.[key])), 0);
      high[key] = Math.max(high[key], sessionHigh);
    }
  }
  return high;
}

async function withoutSession(userId, sessionId, session) {
  const aggregate = await ensureAggregate(userId);
  const next = normalizeAggregate(aggregate);
  const analyticsList = (session.answers || []).map((answer) => answer?.analytics ?? answer).filter((a) => a && typeof a === 'object');
  next.totalAnswers = Math.max(0, next.totalAnswers - analyticsList.length);
  if (session.interviewType === INTERVIEW_TYPES.RESUME) {
    const others = await prisma.interviewAnswer.findMany({
      where: { session: { userId, status: 'COMPLETED', interviewType: INTERVIEW_TYPES.RESUME, id: { not: sessionId } } },
      select: { sessionId: true, analytics: true },
    });
    next.resumeHighScores = recomputeResumeHighScores(others);
    return next;
  }
  const averages = sessionAverages(analyticsList, STRATEGIES[session.interviewType]?.analytics || []);
  for (const key of Object.keys(averages)) {
    next.coreSums[key] = Math.max(0, number(next.coreSums[key]) - averages[key]);
    next.coreCounts[key] = Math.max(0, (next.coreCounts[key] || 0) - 1);
  }
  return next;
}

// How much a single session moved the user's leaderboard average. The current
// average is compared to the average without this session's contribution, so a
// positive contribution means the interview raised the score and a negative one
// means it dragged it down.
async function sessionContribution(userId, sessionId) {
  const current = snapshot(await ensureAggregate(userId));
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId, userId },
    select: { interviewType: true, answers: { select: { analytics: true } } },
  });
  if (!session) return { averageScore: current.averageScore, withoutSession: current.averageScore, contribution: 0 };
  const without = snapshot(await withoutSession(userId, sessionId, session));
  return {
    averageScore: current.averageScore,
    withoutSession: without.averageScore,
    contribution: round(current.averageScore - without.averageScore),
  };
}

module.exports = { ensureAggregate, recordAnswer, recordSession, invalidateLeaderboard, snapshot, sessionContribution, backfillAll };
