const leaderboardService = require('../services/leaderboardService');

async function getLeaderboard(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const result = await leaderboardService.getLeaderboard(limit);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = { getLeaderboard };
