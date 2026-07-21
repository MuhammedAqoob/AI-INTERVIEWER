const localQuestions = require('./localQuestions');
const { BRANCH_REQUIRED_TYPES } = require('../../constants/interviewTypes');

function pickRandom(array) {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

async function getRandomQuestion(branch, interviewType) {
  const prisma = require('../../config/database');
  const where = { interviewType, branch: BRANCH_REQUIRED_TYPES.includes(interviewType) ? branch : null, isActive: true };
  const count = await prisma.interviewQuestionBank.count({ where });
  const databaseQuestion = count ? await prisma.interviewQuestionBank.findFirst({ where, skip: Math.floor(Math.random() * count) }) : null;
  if (databaseQuestion) return { content: databaseQuestion.question, difficulty: databaseQuestion.difficulty };
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
