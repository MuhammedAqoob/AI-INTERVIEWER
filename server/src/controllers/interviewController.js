const interviewService = require('../services/interviewService');
const { BRANCH_LABELS } = require('../constants/branches');
const { INTERVIEW_TYPE_LABELS, BRANCH_REQUIRED_TYPES } = require('../constants/interviewTypes');

async function getOptions(req, res, next) {
  try {
    const branches = Object.entries(BRANCH_LABELS).map(([value, label]) => ({
      value,
      label,
    }));

    const interviewTypes = Object.entries(INTERVIEW_TYPE_LABELS).map(([value, label]) => ({
      value,
      label,
      requiresBranch: BRANCH_REQUIRED_TYPES.includes(value),
    }));

    res.status(200).json({
      success: true,
      data: { branches, interviewTypes },
    });
  } catch (error) {
    next(error);
  }
}

async function getSession(req, res, next) {
  try {
    const { sessionId } = req.query;

    if (sessionId) {
      const result = await interviewService.getSessionById(req.user.id, sessionId);
      return res.status(200).json({ success: true, data: result });
    }

    const result = await interviewService.getActiveSessionsForUser(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function getActiveSessions(req, res, next) {
  try {
    const result = await interviewService.getActiveSessionsForUser(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function start(req, res, next) {
  try {
    const result = await interviewService.startInterview(req.user.id, {
      interviewType: req.body.interviewType,
      branch: req.body.branch,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function answer(req, res, next) {
  try {
    const result = await interviewService.submitAnswer(req.user.id, {
      sessionId: req.body.sessionId,
      answer: req.body.answer,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function end(req, res, next) {
  try {
    const result = await interviewService.endInterview(req.user.id, req.body.sessionId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await interviewService.refreshInterview(req.user.id, {
      interviewType: req.body.interviewType,
      branch: req.body.branch,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = { getOptions, getSession, getActiveSessions, start, answer, end, refresh };
