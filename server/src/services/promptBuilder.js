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

const JSON_OUTPUT_INSTRUCTIONS = `CRITICAL: Return ONLY valid JSON. No markdown. No explanation. No code blocks. No extra text. Just the raw JSON object.`;

const ANALYTICS_SCHEMA = `"analytics": {
    "technicalKnowledge": <0-100 based on technical accuracy and depth>,
    "communication": <0-100 based on clarity, structure, and articulation>,
    "problemSolving": <0-100 based on logical thinking and approach>,
    "confidence": <0-100 based on certainty of language and decisiveness>,
    "grammar": <0-100 based on language correctness and fluency>,
    "leadership": <0-100 based on initiative and decision-making examples>,
    "teamwork": <0-100 based on collaboration and interpersonal examples>,
    "relevance": <0-100 based on how relevant the answer is to the question>,
    "professionalism": <0-100 based on tone, formality, and appropriateness>
  }`;

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
  const turnNumber = conversationHistory.filter((m) => m.role === 'user').length;

  let systemPrompt = `You are an expert interviewer conducting ${typeContext}.
The interview is currently at question ${turnNumber}. The current difficulty level is ${difficultyLabel}.

CRITICAL RULES:
- Evaluate the candidate LAST answer only. Do not evaluate earlier answers.
- Scores must reflect the ACTUAL quality of the answer. Not random.
- Adapt difficulty based on performance:
  * If the candidate scores 8-10, increase difficulty for the next question.
  * If the candidate scores 1-4, decrease difficulty for the next question.
  * If the candidate scores 5-7, maintain or slightly adjust difficulty.
- Questions must be CONTINUOUS. Build on previous answers. Never ask unrelated questions.
- If the candidate mentions a concept, dig deeper into it in the next question.
- After 10 questions, set shouldEnd to true.
- Each analytics score must be based on EVIDENCE from the answer, not guessed.

${JSON_OUTPUT_INSTRUCTIONS}

Return this EXACT JSON structure:
{
  "evaluation": {
    "score": <number 1-10, based on accuracy, depth, clarity, relevance>,
    "feedback": "<1-2 sentences of constructive feedback on the last answer>",
    "betterAnswer": "<if score < 7, provide a model answer. Otherwise null>",
    "explanation": "<brief explanation of why this score was given>"
  },
  "analytics": ${ANALYTICS_SCHEMA},
  "nextQuestion": {
    "content": "<the next question, building on previous answers>",
    "difficulty": "<EASY|MEDIUM|HARD based on performance>"
  },
  "shouldHire": <boolean, true only if candidate demonstrates strong overall performance>,
  "hireReason": "<brief explanation of hire/no-hire decision>",
  "improvements": ["<specific improvement suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "shouldEnd": <boolean, true after 10 questions or if candidate is clearly unqualified>
}`;

  if (branch && interviewType === INTERVIEW_TYPES.TECHNICAL) {
    systemPrompt += `\n\nThe candidate branch of engineering is: ${branch}. All technical questions MUST be relevant to ${branch}. Do not ask about unrelated engineering domains.`;
  }

  if (interviewType === INTERVIEW_TYPES.HR) {
    systemPrompt += `\n\nThis is an HR interview. Focus on behavioral questions, situational judgment, cultural fit, and soft skills. Do not ask technical questions.`;
  }

  if (interviewType === INTERVIEW_TYPES.APTITUDE) {
    systemPrompt += `\n\nThis is an aptitude interview. Focus on logical reasoning, quantitative ability, pattern recognition, and problem-solving. Questions should gradually increase in difficulty.`;
  }

  if (interviewType === INTERVIEW_TYPES.RESUME && resumeSummary) {
    systemPrompt += `\n\nCandidate resume summary:\n${resumeSummary}\n\nAll questions MUST be based on this resume. Ask about specific projects, skills, and experiences mentioned. Dig into technical details of their work. Ask about challenges they faced and how they solved them.`;
  }

  const userPrompt = `Interview conversation so far:\n${conversationText}\n\nThe candidate just answered question ${turnNumber}. Evaluate their last answer and generate the next question. Remember: the next question must build on what they just said.`;

  return { systemPrompt, userPrompt };
}

function buildFirstQuestionPrompt({ branch, interviewType, difficulty, resumeSummary }) {
  const typeContext = INTERVIEW_TYPE_CONTEXT[interviewType] || INTERVIEW_TYPE_CONTEXT[INTERVIEW_TYPES.TECHNICAL];
  const difficultyLabel = DIFFICULTY_LABELS[difficulty] || DIFFICULTY_LABELS[DIFFICULTY.EASY];

  let systemPrompt = `You are an expert interviewer conducting ${typeContext}.
Generate the FIRST interview question at ${difficultyLabel} difficulty level.

The first question should:
- Be engaging and professional
- Be appropriate for the difficulty level
- For Resume interviews: be directly based on the candidate resume
- For Technical interviews: be relevant to the engineering branch
- For HR interviews: be a behavioral or situational question
- For Aptitude interviews: be a logical reasoning or quantitative question

${JSON_OUTPUT_INSTRUCTIONS}

Return this EXACT JSON structure:
{
  "question": "<the opening question>",
  "difficulty": "<EASY|MEDIUM|HARD>"
}`;

  if (branch && interviewType === INTERVIEW_TYPES.TECHNICAL) {
    systemPrompt += `\n\nThe candidate branch of engineering is: ${branch}. The opening question must be relevant to ${branch}.`;
  }

  if (interviewType === INTERVIEW_TYPES.RESUME && resumeSummary) {
    systemPrompt += `\n\nCandidate resume summary:\n${resumeSummary}\n\nGenerate an opening question based on this candidate specific background. Reference a specific project, skill, or experience from their resume. Example: "I noticed you worked on [specific project]. Can you explain its architecture?"`;
  }

  if (interviewType === INTERVIEW_TYPES.HR) {
    systemPrompt += `\n\nThis is an HR interview. Start with a behavioral or situational question.`;
  }

  if (interviewType === INTERVIEW_TYPES.APTITUDE) {
    systemPrompt += `\n\nThis is an aptitude interview. Start with a logical reasoning or quantitative question at ${difficultyLabel} difficulty.`;
  }

  const userPrompt = 'Generate the first interview question now.';

  return { systemPrompt, userPrompt };
}

function buildResumeSummaryPrompt({ resumeText }) {
  const systemPrompt = `You are a resume analysis expert. Extract and summarize the key information from this resume.

Create a concise, structured summary including:
- Candidate name (if present)
- Education background
- Work experience (company, role, duration, key responsibilities)
- Technical skills and competencies
- Notable projects or achievements
- Areas of expertise

Be concise but thorough. Focus on facts useful for conducting a technical interview.

${JSON_OUTPUT_INSTRUCTIONS}

Return this EXACT JSON structure:
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

  result.systemPrompt += '\n\nOnly evaluate the last answer. Set shouldEnd to true and nextQuestion to null.';

  return result;
}

module.exports = {
  buildInterviewTurnPrompt,
  buildFirstQuestionPrompt,
  buildResumeSummaryPrompt,
  buildEvaluationOnlyPrompt,
  formatConversationForPrompt,
};
