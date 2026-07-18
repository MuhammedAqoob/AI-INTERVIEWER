const { DIFFICULTY } = require('../../constants/difficulty');

const EASY_FOLLOW_UPS = [
  'Can you elaborate on that further?',
  'How would you explain that to someone with no technical background?',
  'Can you give a real-world example?',
  'What are the key advantages of what you just described?',
  'How does that compare to the alternative approach?',
];

const MEDIUM_FOLLOW_UPS = [
  'What are the trade-offs of the approach you described?',
  'Can you discuss a scenario where this would not work well?',
  'How does this scale in a production environment?',
  'What design considerations should be kept in mind here?',
  'How would you test this in a real-world application?',
];

const HARD_FOLLOW_UPS = [
  'How would you optimize this for high-throughput systems?',
  'Can you analyze the time and space complexity of your approach?',
  'How would this behave under concurrent access?',
  'What would you change if the dataset grew to millions of records?',
  'How does this relate to distributed system design principles?',
];

const DIFFICULTY_QUESTIONS = {
  [DIFFICULTY.EASY]: EASY_FOLLOW_UPS,
  [DIFFICULTY.MEDIUM]: MEDIUM_FOLLOW_UPS,
  [DIFFICULTY.HARD]: HARD_FOLLOW_UPS,
};

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getLastUserAnswer(conversationHistory) {
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    if (conversationHistory[i].role === 'user') {
      return conversationHistory[i].content;
    }
  }
  return '';
}

function generateInterviewTurn({ branch, interviewType, conversationHistory, difficulty, resumeSummary }) {
  const lastAnswer = getLastUserAnswer(conversationHistory);
  const answerLength = lastAnswer.length;

  let score;
  if (answerLength > 200) {
    score = 8 + Math.floor(Math.random() * 3);
  } else if (answerLength > 100) {
    score = 6 + Math.floor(Math.random() * 3);
  } else {
    score = 4 + Math.floor(Math.random() * 3);
  }
  score = Math.min(score, 10);

  let feedback;
  if (score >= 8) {
    feedback = 'Strong answer. You demonstrated good understanding.';
  } else if (score >= 6) {
    feedback = 'Decent answer. There is room for improvement in depth and clarity.';
  } else {
    feedback = 'The answer needs more detail. Consider revisiting the core concepts.';
  }

  const totalUserMessages = conversationHistory.filter((m) => m.role === 'user').length;
  const shouldEnd = totalUserMessages >= 10;

  if (shouldEnd) {
    return {
      evaluation: { score, feedback, betterAnswer: null, explanation: 'End of interview.' },
      analytics: generateMockAnalytics(score),
      nextQuestion: null,
      shouldHire: score >= 6,
      hireReason: score >= 6 ? 'Good performance overall.' : 'Needs improvement in key areas.',
      improvements: ['Provide more detailed answers.', 'Use specific examples.'],
      shouldEnd: true,
    };
  }

  let nextDifficulty = difficulty;
  if (score >= 8 && difficulty === DIFFICULTY.EASY) {
    nextDifficulty = DIFFICULTY.MEDIUM;
  } else if (score >= 8 && difficulty === DIFFICULTY.MEDIUM) {
    nextDifficulty = DIFFICULTY.HARD;
  } else if (score <= 4 && difficulty === DIFFICULTY.HARD) {
    nextDifficulty = DIFFICULTY.MEDIUM;
  } else if (score <= 4 && difficulty === DIFFICULTY.MEDIUM) {
    nextDifficulty = DIFFICULTY.EASY;
  }

  const nextQuestionPool = DIFFICULTY_QUESTIONS[nextDifficulty] || DIFFICULTY_QUESTIONS[DIFFICULTY.EASY];
  const nextQuestionContent = pickRandom(nextQuestionPool);

  return {
    evaluation: {
      score,
      feedback,
      betterAnswer: score < 7 ? 'A complete answer would include more technical detail and examples.' : null,
      explanation: `Score based on answer length and apparent depth.`,
    },
    analytics: generateMockAnalytics(score),
    nextQuestion: { content: nextQuestionContent, difficulty: nextDifficulty },
    shouldHire: false,
    hireReason: '',
    improvements: [
      'Provide more detailed answers.',
      'Use specific examples.',
      'Explain trade-offs.',
    ],
    shouldEnd: false,
  };
}

function generateMockAnalytics(score) {
  const base = Math.max(20, Math.min(90, score * 10));
  return {
    technicalKnowledge: base + Math.floor(Math.random() * 10) - 5,
    communication: base + Math.floor(Math.random() * 10) - 5,
    problemSolving: base + Math.floor(Math.random() * 10) - 5,
    confidence: base + Math.floor(Math.random() * 10) - 5,
    grammar: base + Math.floor(Math.random() * 10) - 5,
    leadership: 50 + Math.floor(Math.random() * 10) - 5,
    teamwork: 50 + Math.floor(Math.random() * 10) - 5,
    relevance: base + Math.floor(Math.random() * 10) - 5,
    professionalism: base + Math.floor(Math.random() * 10) - 5,
  };
}

function generateFirstQuestion({ branch, interviewType, difficulty, resumeSummary }) {
  const nextQuestionPool = DIFFICULTY_QUESTIONS[difficulty] || DIFFICULTY_QUESTIONS[DIFFICULTY.EASY];
  const question = pickRandom(nextQuestionPool);

  return {
    content: question,
    difficulty,
  };
}

async function generateStructuredResponse({ systemPrompt, userPrompt }) {
  return {
    score: 7,
    feedback: 'Mock provider response.',
    betterAnswer: null,
    question: 'Can you tell me about your experience?',
    difficulty: DIFFICULTY.EASY,
    summary: 'Mock resume summary.',
  };
}

module.exports = {
  generateInterviewTurn,
  generateFirstQuestion,
  generateStructuredResponse,
};
