const express = require('express');
const {
  getOptions,
  getSession,
  getActiveSessions,
  start,
  startResume,
  answer,
  end,
  refresh,
} = require('../controllers/interviewController');
const authenticate = require('../middleware/authenticate');
const {
  startInterviewValidation,
  startResumeInterviewValidation,
  answerValidation,
  endInterviewValidation,
  refreshInterviewValidation,
  validateSessionIdQuery,
} = require('../middleware/validate');
const {
  interviewStartLimiter,
  interviewAnswerLimiter,
  interviewEndLimiter,
  interviewRefreshLimiter,
  interviewStatusLimiter,
} = require('../middleware/rateLimiter');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

router.get('/options', authenticate, getOptions);

router.get('/status', authenticate, interviewStatusLimiter, validateSessionIdQuery, getSession);

router.get('/active', authenticate, interviewStatusLimiter, getActiveSessions);

router.post(
  '/start',
  authenticate,
  interviewStartLimiter,
  startInterviewValidation,
  start
);

router.post(
  '/start-resume',
  authenticate,
  interviewStartLimiter,
  upload.single('resume'),
  handleMulterError,
  startResumeInterviewValidation,
  startResume
);

router.post(
  '/answer',
  authenticate,
  interviewAnswerLimiter,
  answerValidation,
  answer
);

router.post(
  '/end',
  authenticate,
  interviewEndLimiter,
  endInterviewValidation,
  end
);

router.post(
  '/refresh',
  authenticate,
  interviewRefreshLimiter,
  refreshInterviewValidation,
  refresh
);

module.exports = router;
