const localQuestions = require('./localQuestions');
const { BRANCH_REQUIRED_TYPES } = require('../../constants/interviewTypes');

function pickRandom(array) {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

async function getRandomQuestion(branch, interviewType, excludeContents) {
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

  // Question rotation: exclude previously completed opening questions.
  // If all questions in the pool have been used, reset and pick from the
  // full pool so the user is never blocked from starting an interview.
  if (excludeContents && excludeContents.length > 0) {
    const excludeSet = new Set(excludeContents);
    const available = questionPool.filter((q) => !excludeSet.has(q.content));
    if (available.length > 0) return pickRandom(available);
    // Pool exhaustion — all questions used, reset rotation.
  }

  return pickRandom(questionPool);
}

module.exports = { getRandomQuestion };
