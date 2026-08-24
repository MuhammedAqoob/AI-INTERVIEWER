const express = require('express');
const {
  getOptions,
  getHistory,
  getSessionDetails,
  start,
  startResume,
  answer,
  pause,
  resume,
  endSession,
  retake,
  deleteSession,
} = require('../controllers/interviewController');
const { getLeaderboard } = require('../controllers/leaderboardController');
const authenticate = require('../middleware/authenticate');
const {
  startInterviewValidation,
  startResumeInterviewValidation,
  answerValidation,
  validateSessionIdParam,
  historyValidation,
} = require('../middleware/validate');
const {
  interviewStartLimiter,
  interviewAnswerLimiter,
  interviewDeleteLimiter,
  interviewStatusLimiter,
  leaderboardLimiter,
} = require('../middleware/rateLimiter');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

router.get('/options', authenticate, getOptions);

router.get('/history', authenticate, interviewStatusLimiter, historyValidation, getHistory);

router.get('/leaderboard', leaderboardLimiter, getLeaderboard);

router.post(
  '/start',
  authenticate,
  interviewStartLimiter,
  startInterviewValidation,
  start
);

router.get('/:sessionId', authenticate, interviewStatusLimiter, validateSessionIdParam, getSessionDetails);

router.post('/:sessionId/pause', authenticate, interviewStatusLimiter, validateSessionIdParam, pause);
router.post('/:sessionId/resume', authenticate, interviewStatusLimiter, validateSessionIdParam, resume);
router.post('/:sessionId/end', authenticate, interviewStatusLimiter, validateSessionIdParam, endSession);
router.post('/:sessionId/retake', authenticate, interviewStartLimiter, validateSessionIdParam, retake);

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

router.delete(
  '/:sessionId',
  authenticate,
  interviewDeleteLimiter,
  validateSessionIdParam,
  deleteSession
);

module.exports = router;
