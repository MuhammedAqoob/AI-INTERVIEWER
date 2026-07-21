const { body, query, param, validationResult } = require('express-validator');
const { BRANCH_VALUES } = require('../constants/branches');
const { INTERVIEW_TYPE_VALUES, BRANCH_REQUIRED_TYPES } = require('../constants/interviewTypes');
const { DIFFICULTY_VALUES } = require('../constants/difficulty');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
}

const registerValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  handleValidationErrors,
];

const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

const startInterviewValidation = [
  body('interviewType')
    .notEmpty()
    .withMessage('Interview type is required')
    .isIn(INTERVIEW_TYPE_VALUES)
    .withMessage(`Interview type must be one of: ${INTERVIEW_TYPE_VALUES.join(', ')}`),
  body('branch')
    .custom((value, { req }) => {
      if (BRANCH_REQUIRED_TYPES.includes(req.body.interviewType)) {
        if (!value) {
          throw new Error('Branch is required for Technical interviews');
        }
        if (!BRANCH_VALUES.includes(value)) {
          throw new Error(`Branch must be one of: ${BRANCH_VALUES.join(', ')}`);
        }
      }
      return true;
    }),
  body('difficulty')
    .optional()
    .isIn(DIFFICULTY_VALUES)
    .withMessage(`Difficulty must be one of: ${DIFFICULTY_VALUES.join(', ')}`),
  body('questionLimit').isIn([5, 10, 20]).withMessage('Question limit must be 5, 10, or 20'),
  handleValidationErrors,
];

const answerValidation = [
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isUUID()
    .withMessage('Session ID must be a valid UUID'),
  body('answer')
    .trim()
    .notEmpty()
    .withMessage('Answer is required')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Answer must be between 1 and 5000 characters'),
  handleValidationErrors,
];

const startResumeInterviewValidation = [
  body('questionLimit').isIn([5, 10, 20]).withMessage('Question limit must be 5, 10, or 20'),
  body('difficulty')
    .optional()
    .isIn(DIFFICULTY_VALUES)
    .withMessage(`Difficulty must be one of: ${DIFFICULTY_VALUES.join(', ')}`),
  handleValidationErrors,
];

const validateSessionIdQuery = [
  query('sessionId')
    .optional()
    .isUUID()
    .withMessage('Session ID must be a valid UUID'),
  handleValidationErrors,
];

const validateSessionIdParam = [
  param('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isUUID()
    .withMessage('Session ID must be a valid UUID'),
  handleValidationErrors,
];

const historyValidation = [
  query('interviewType')
    .optional()
    .isIn(INTERVIEW_TYPE_VALUES)
    .withMessage(`Interview type must be one of: ${INTERVIEW_TYPE_VALUES.join(', ')}`),
  query('branch')
    .optional()
    .isIn(BRANCH_VALUES)
    .withMessage(`Branch must be one of: ${BRANCH_VALUES.join(', ')}`),
  query('difficulty')
    .optional()
    .isIn(DIFFICULTY_VALUES)
    .withMessage(`Difficulty must be one of: ${DIFFICULTY_VALUES.join(', ')}`),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  startInterviewValidation,
  startResumeInterviewValidation,
  answerValidation,
  validateSessionIdQuery,
  validateSessionIdParam,
  historyValidation,
};
