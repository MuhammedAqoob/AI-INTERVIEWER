const statsService = require('../services/statsService');

async function getSummary(req, res, next) {
  try {
    const summary = await statsService.getDashboardSummary(req.user.id);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}

module.exports = { getSummary };
