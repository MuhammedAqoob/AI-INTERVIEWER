const interviewService = require('../services/interviewService');
const resumeService = require('../services/resumeService');
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

async function getHistory(req, res, next) {
  try {
    const result = await interviewService.getHistory(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function getSessionDetails(req, res, next) {
  try {
    const result = await interviewService.getSessionDetails(req.user.id, req.params.sessionId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function start(req, res, next) {
  try {
    if (req.body.interviewType === 'RESUME') {
      return res.status(400).json({
        success: false,
        message: 'Resume interviews require a file upload. Use /api/interview/start-resume instead.',
      });
    }

    const result = await interviewService.startInterview(req.user.id, {
      interviewType: req.body.interviewType,
      branch: req.body.branch,
      questionLimit: req.body.questionLimit,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function startResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Resume file is required. Upload a PDF or image.',
      });
    }

    const { summary } = await resumeService.processResume(
      req.file.buffer,
      req.file.mimetype
    );

    const result = await interviewService.startResumeInterview(req.user.id, {
      questionLimit: Number(req.body.questionLimit),
      resumeSummary: summary,
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

async function pause(req, res, next) { try { const result = await interviewService.pause(req.user.id, req.params.sessionId); res.status(200).json({ success: true, data: result }); } catch (error) { next(error); } }
async function resume(req, res, next) { try { const result = await interviewService.resume(req.user.id, req.params.sessionId); res.status(200).json({ success: true, data: result }); } catch (error) { next(error); } }

async function deleteSession(req, res, next) {
  try {
    const result = await interviewService.deleteSession(req.user.id, req.params.sessionId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOptions,
  getHistory,
  getSessionDetails,
  start,
  startResume,
  answer,
  pause,
  resume,
  deleteSession,
};
