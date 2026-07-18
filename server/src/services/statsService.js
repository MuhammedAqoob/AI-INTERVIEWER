const prisma = require('../config/database');

const MAX_LIVES = 5;
const STREAK_GRACE_PERIOD_HOURS = 24;

function getNextMidnightUTC() {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return tomorrow;
}

function isToday(date) {
  if (!date) return false;
  const now = new Date();
  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate()
  );
}

function isYesterday(date) {
  if (!date) return false;
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return (
    date.getUTCFullYear() === yesterday.getUTCFullYear() &&
    date.getUTCMonth() === yesterday.getUTCMonth() &&
    date.getUTCDate() === yesterday.getUTCDate()
  );
}

function isBeforeYesterday(date) {
  if (!date) return false;
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);
  return date < yesterday;
}

async function getOrCreateUserStats(userId) {
  let stats = await prisma.userStats.findUnique({ where: { userId } });

  if (!stats) {
    stats = await prisma.userStats.create({
      data: {
        userId,
        livesRemaining: MAX_LIVES,
        livesResetAt: getNextMidnightUTC(),
        currentStreak: 0,
        bestStreak: 0,
        totalInterviews: 0,
      },
    });
  }

  return stats;
}

async function resetLivesIfNeeded(userId) {
  const stats = await getOrCreateUserStats(userId);

  if (stats.livesResetAt < new Date()) {
    const updated = await prisma.userStats.update({
      where: { userId },
      data: {
        livesRemaining: MAX_LIVES,
        livesResetAt: getNextMidnightUTC(),
      },
    });
    return updated;
  }

  return stats;
}

async function consumeLife(userId) {
  const stats = await resetLivesIfNeeded(userId);

  if (stats.livesRemaining <= 0) {
    return {
      success: false,
      remainingLives: 0,
      reason: 'NO_LIVES',
    };
  }

  const updated = await prisma.userStats.update({
    where: { userId },
    data: { livesRemaining: stats.livesRemaining - 1 },
  });

  return {
    success: true,
    remainingLives: updated.livesRemaining,
  };
}

async function calculateStreak(userId) {
  const stats = await getOrCreateUserStats(userId);
  let { currentStreak, bestStreak } = stats;
  const { lastInterviewAt } = stats;

  if (!lastInterviewAt) {
    currentStreak = 1;
  } else if (isToday(lastInterviewAt)) {
    // Already counted today, no change
  } else if (isYesterday(lastInterviewAt)) {
    currentStreak += 1;
  } else if (isBeforeYesterday(lastInterviewAt)) {
    currentStreak = 1;
  }

  if (currentStreak > bestStreak) {
    bestStreak = currentStreak;
  }

  return prisma.userStats.update({
    where: { userId },
    data: {
      currentStreak,
      bestStreak,
      lastInterviewAt: new Date(),
    },
  });
}

async function incrementTotalInterviews(userId) {
  return prisma.userStats.update({
    where: { userId },
    data: { totalInterviews: { increment: 1 } },
  });
}

async function getDashboardSummary(userId) {
  const stats = await resetLivesIfNeeded(userId);

  return {
    livesRemaining: stats.livesRemaining,
    livesResetAt: stats.livesResetAt,
    currentStreak: stats.currentStreak,
    bestStreak: stats.bestStreak,
    totalInterviews: stats.totalInterviews,
    canStartInterview: true,
  };
}

module.exports = {
  getOrCreateUserStats,
  resetLivesIfNeeded,
  consumeLife,
  calculateStreak,
  incrementTotalInterviews,
  getDashboardSummary,
};
