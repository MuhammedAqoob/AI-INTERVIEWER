const { PDFParse } = require('pdf-parse');
const Tesseract = require('tesseract.js');
const aiProvider = require('./ai');
const AppError = require('../utils/AppError');

const MIN_TEXT_LENGTH = 50;

function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ +/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\S\n]+/g, ' ')
    .trim();
}

async function extractFromPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText({ pageJoiner: '' });
    return cleanText(result?.text || '');
  } finally {
    await parser.destroy();
  }
}

async function extractFromImage(buffer) {
  const { data } = await Tesseract.recognize(buffer, 'eng', {});
  return cleanText(data.text || '');
}

async function extractText(buffer, mimeType) {
  let text = '';

  if (mimeType === 'application/pdf') {
    text = await extractFromPdf(buffer);

    if (text.length < MIN_TEXT_LENGTH) {
      text = await extractFromImage(buffer);
    }
  } else if (mimeType.startsWith('image/')) {
    text = await extractFromImage(buffer);
  } else {
    throw new AppError('Unsupported file type. Please upload a PDF or image.', 400);
  }

  if (!text || text.trim().length < 10) {
    throw new AppError('Could not extract readable text from the file. Please upload a clearer document.', 400);
  }

  return text;
}

async function generateResumeSummary(resumeText) {
  const prompts = require('./promptBuilder').buildResumeSummaryPrompt({ resumeText });

  const result = await aiProvider.generateStructuredResponse(prompts);

  if (result && result.summary) {
    return result.summary;
  }

  return resumeText.substring(0, 1000);
}

async function processResume(buffer, mimeType) {
  const rawText = await extractText(buffer, mimeType);
  const summary = await generateResumeSummary(rawText);

  return {
    summary,
    rawTextLength: rawText.length,
  };
}

module.exports = {
  processResume,
  extractText,
  cleanText,
  generateResumeSummary,
};
