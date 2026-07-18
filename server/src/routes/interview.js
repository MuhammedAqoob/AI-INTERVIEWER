const express = require('express');
const {
  getOptions,
  getSession,
  getActiveSessions,
  start,
  answer,
  end,
  refresh,
} = require('../controllers/interviewController');
const authenticate = require('../middleware/authenticate');
const {
  startInterviewValidation,
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
