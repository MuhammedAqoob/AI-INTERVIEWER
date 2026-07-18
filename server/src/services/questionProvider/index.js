const localQuestions = require('./localQuestions');
const { BRANCH_REQUIRED_TYPES } = require('../../constants/interviewTypes');

function pickRandom(array) {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

function getRandomQuestion(branch, interviewType) {
  let questionPool;

  if (BRANCH_REQUIRED_TYPES.includes(interviewType)) {
    if (!branch || !localQuestions[branch]) {
      throw new Error(`No questions found for branch: ${branch}, type: ${interviewType}`);
    }
    questionPool = localQuestions[branch][interviewType];
  } else {
    if (!localQuestions.GLOBAL || !localQuestions.GLOBAL[interviewType]) {
      throw new Error(`No questions found for type: ${interviewType}`);
    }
    questionPool = localQuestions.GLOBAL[interviewType];
  }

  if (!questionPool || questionPool.length === 0) {
    throw new Error(`No questions available for branch: ${branch || 'GLOBAL'}, type: ${interviewType}`);
  }

  return pickRandom(questionPool);
}

module.exports = { getRandomQuestion };
