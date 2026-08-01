const { getStrategy } = require('./interviewStrategy');

const JSON_RULE = 'Return only valid JSON. No Markdown, prose, code fences, or additional fields.';

function buildInterviewTurnPrompt({ interviewType, branch, questionNumber, questionLimit, difficulty, rollingSummary, currentQuestion, candidateAnswer }) {
  const metrics = getStrategy(interviewType).analytics.map((key) => `"${key}": <integer 0-100>`).join(', ');
  const questionRule = questionNumber >= questionLimit
    ? `This is the final question (${questionNumber} of ${questionLimit}), so nextQuestion must be null.`
    : `This is not the final question (${questionNumber} of ${questionLimit}). You MUST return a non-null nextQuestion object. Never end the interview early, even if the candidate answer is weak; lower the difficulty and ask a simpler follow-up instead.`;
  const systemPrompt = `You are a professional ${interviewType} interviewer. Evaluate only the latest answer, update compact interview memory, and generate the next logical question. Never repeat a previous question. Keep updatedSummary to 100-150 words maximum. Adapt difficulty naturally. ${questionRule} ${JSON_RULE}\nbetterAnswer must be a rewritten, model-quality version of the candidate's own answer: a strong response the candidate could give aloud, that includes the key points they missed, is 1-4 sentences, written in the same language as the candidate's answer, and phrased as the candidate speaking. It must NOT be feedback, an evaluation, a critique, or a list of suggestions. Return exactly: {"betterAnswer":"...","nextQuestion":{"content":"...","difficulty":"EASY|MEDIUM|HARD"}|null,"updatedSummary":"...","analytics":{${metrics}}}.`;
  const userPrompt = `Interview Type: ${interviewType}\nBranch: ${branch || 'N/A'}\nQuestion: ${questionNumber} / ${questionLimit}\nDifficulty: ${difficulty}\nRolling Summary: ${rollingSummary || 'No prior answers.'}\nCurrent Question: ${currentQuestion}\nCandidate Answer: ${candidateAnswer}`;
  return { systemPrompt, userPrompt };
}

function buildFirstQuestionPrompt({ branch, interviewType, difficulty, resumeSummary }) {
  return {
    systemPrompt: `You are a professional resume interviewer. Generate one concise opening question based only on the resume. ${JSON_RULE} Return exactly {"question":"...","difficulty":"EASY|MEDIUM|HARD"}.`,
    userPrompt: `Interview Type: ${interviewType}\nBranch: ${branch || 'N/A'}\nDifficulty: ${difficulty}\nResume Summary: ${resumeSummary}`,
  };
}

function buildFinalEvaluationPrompt({ interviewType, rollingSummary, analytics, questionCount }) {
  return {
    systemPrompt: `Create a final interview evaluation. ${JSON_RULE} Return exactly {"overallSummary":"...","strengths":["..."],"weaknesses":["..."],"hireRecommendation":"HIRE|MAYBE|NO_HIRE","hireReason":"...","learningRoadmap":["..."]}.`,
    userPrompt: `Interview Type: ${interviewType}\nAnswered Questions: ${questionCount}\nRolling Summary: ${rollingSummary}\nAverage Analytics: ${JSON.stringify(analytics)}`,
  };
}

function buildResumeSummaryPrompt({ resumeText }) {
  return { systemPrompt: `Summarize this resume in 200-400 words for an interviewer. ${JSON_RULE} Return exactly {"summary":"..."}.`, userPrompt: `Resume content:\n${resumeText}` };
}

module.exports = { buildInterviewTurnPrompt, buildFirstQuestionPrompt, buildFinalEvaluationPrompt, buildResumeSummaryPrompt };
