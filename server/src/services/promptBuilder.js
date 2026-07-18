const { INTERVIEW_TYPES } = require('../constants/interviewTypes');
const { DIFFICULTY } = require('../constants/difficulty');

const DIFFICULTY_LABELS = {
  [DIFFICULTY.EASY]: 'easy',
  [DIFFICULTY.MEDIUM]: 'medium',
  [DIFFICULTY.HARD]: 'hard',
};

const INTERVIEW_TYPE_CONTEXT = {
  [INTERVIEW_TYPES.TECHNICAL]: 'a technical interview for an engineering position',
  [INTERVIEW_TYPES.HR]: 'a human resources and behavioral interview',
  [INTERVIEW_TYPES.APTITUDE]: 'an aptitude and problem-solving interview',
  [INTERVIEW_TYPES.RESUME]: 'a resume-based interview tailored to the candidate background',
};

function formatConversationForPrompt(conversationHistory) {
  return conversationHistory
    .map((msg) => {
      const role = msg.role === 'user' ? 'Candidate' : 'Interviewer';
      return `${role}: ${msg.content}`;
    })
    .join('\n');
}

function buildInterviewTurnPrompt({ branch, interviewType, conversationHistory, difficulty, resumeSummary }) {
  const typeContext = INTERVIEW_TYPE_CONTEXT[interviewType] || INTERVIEW_TYPE_CONTEXT[INTERVIEW_TYPES.TECHNICAL];
  const difficultyLabel = DIFFICULTY_LABELS[difficulty] || DIFFICULTY_LABELS[DIFFICULTY.EASY];
  const conversationText = formatConversationForPrompt(conversationHistory);

  let systemPrompt = `You are an expert interviewer conducting ${typeContext}.
The current difficulty level is ${difficultyLabel}.

Your role:
1. Evaluate the candidate last answer on a scale of 1-10 based on: accuracy, depth, clarity, and relevance.
2. Provide concise, constructive feedback (1-2 sentences).
3. Generate the next question at the appropriate difficulty level.
4. If the candidate has answered 10 questions, signal the interview to end.

Response format: Return a JSON object with this exact structure:
{
  "evaluation": {
    "score": <number 1-10>,
    "feedback": "<concise feedback>",
    "betterAnswer": "<optional model answer if score < 7, otherwise null>"
  },
  "nextQuestion": {
    "content": "<the next question>",
    "difficulty": "<EASY|MEDIUM|HARD>"
  },
  "shouldEnd": <boolean>
}`;

  if (branch && interviewType === INTERVIEW_TYPES.TECHNICAL) {
    systemPrompt += `\n\nThe candidate branch of engineering is: ${branch}. Focus questions on this domain.`;
  }

  if (interviewType === INTERVIEW_TYPES.RESUME && resumeSummary) {
    systemPrompt += `\n\nCandidate resume summary:\n${resumeSummary}\n\nBase your questions on this candidate background and experience.`;
  }

  const userPrompt = `Interview conversation so far:\n${conversationText}\n\nEvaluate the candidate last answer and provide the next question.`;

  return { systemPrompt, userPrompt };
}

function buildFirstQuestionPrompt({ branch, interviewType, difficulty, resumeSummary }) {
  const typeContext = INTERVIEW_TYPE_CONTEXT[interviewType] || INTERVIEW_TYPE_CONTEXT[INTERVIEW_TYPES.TECHNICAL];
  const difficultyLabel = DIFFICULTY_LABELS[difficulty] || DIFFICULTY_LABELS[DIFFICULTY.EASY];

  let systemPrompt = `You are an expert interviewer conducting ${typeContext}.
Generate the FIRST interview question at ${difficultyLabel} difficulty level.

Response format: Return a JSON object with this exact structure:
{
  "question": "<the opening question>",
  "difficulty": "<EASY|MEDIUM|HARD>"
}`;

  if (branch && interviewType === INTERVIEW_TYPES.TECHNICAL) {
    systemPrompt += `\n\nThe candidate branch of engineering is: ${branch}. Focus the opening question on this domain.`;
  }

  if (interviewType === INTERVIEW_TYPES.RESUME && resumeSummary) {
    systemPrompt += `\n\nCandidate resume summary:\n${resumeSummary}\n\nGenerate an opening question based on this candidate background and experience.`;
  }

  const userPrompt = 'Generate the first interview question now.';

  return { systemPrompt, userPrompt };
}

function buildResumeSummaryPrompt({ resumeText }) {
  const systemPrompt = `You are a resume analysis expert. Extract and summarize the key information from this resume.

Create a concise, structured summary including:
- Candidate name (if present)
- Contact information (if present)
- Education background
- Work experience (company, role, duration, key responsibilities)
- Technical skills and competencies
- Notable projects or achievements
- Areas of expertise

Be concise but thorough. Focus on facts that are useful for conducting a technical interview.

Response format: Return a JSON object with this exact structure:
{
  "summary": "<concise resume summary in plain text, 200-400 words>"
}`;

  const userPrompt = `Resume content:\n${resumeText}`;

  return { systemPrompt, userPrompt };
}

function buildEvaluationOnlyPrompt({ branch, interviewType, conversationHistory, difficulty, resumeSummary }) {
  const result = buildInterviewTurnPrompt({
    branch,
    interviewType,
    conversationHistory,
    difficulty,
    resumeSummary,
  });

  result.systemPrompt += '\n\nOnly evaluate the last answer. Do not generate a next question.';

  return result;
}

module.exports = {
  buildInterviewTurnPrompt,
  buildFirstQuestionPrompt,
  buildResumeSummaryPrompt,
  buildEvaluationOnlyPrompt,
  formatConversationForPrompt,
};
