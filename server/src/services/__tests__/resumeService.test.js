const { extractText } = require('../resumeService');
const AppError = require('../../utils/AppError');

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(({ data }) => ({
    getText: jest.fn().mockResolvedValue({ text: 'Mocked resume text from pdf-parse v2 with a sufficiently long body of content for extraction.' }),
    destroy: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('tesseract.js', () => ({
  recognize: jest.fn().mockResolvedValue({ data: { text: 'Mocked OCR text from image' } }),
}));

const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

describe('resumeService.extractText', () => {
  beforeEach(() => jest.clearAllMocks());

  test('extracts text from a PDF using the pdf-parse v2 API', async () => {
    const text = await extractText(Buffer.from('%PDF-1.4'), 'application/pdf');

    expect(pdfParse.PDFParse).toHaveBeenCalledWith({ data: expect.any(Buffer) });
    expect(text).toContain('sufficiently long body');
    expect(Tesseract.recognize).not.toHaveBeenCalled();
  });

  test('falls back to OCR when the PDF yields too little text', async () => {
    pdfParse.PDFParse.mockImplementation(() => ({
      getText: jest.fn().mockResolvedValue({ text: 'short' }),
      destroy: jest.fn().mockResolvedValue(undefined),
    }));

    const text = await extractText(Buffer.from('%PDF-1.4'), 'application/pdf');

    expect(Tesseract.recognize).toHaveBeenCalled();
    expect(text).toContain('Mocked OCR text');
  });

  test('extracts text from an image via OCR', async () => {
    const text = await extractText(Buffer.from('png'), 'image/png');

    expect(Tesseract.recognize).toHaveBeenCalledWith(expect.any(Buffer), 'eng', {});
    expect(text).toContain('Mocked OCR text');
  });

  test('rejects unsupported file types', async () => {
    await expect(extractText(Buffer.from('data'), 'text/plain')).rejects.toThrow(AppError);
  });

  test('rejects a file with no readable text', async () => {
    Tesseract.recognize.mockResolvedValue({ data: { text: '' } });

    await expect(extractText(Buffer.from('png'), 'image/png')).rejects.toThrow(
      'Could not extract readable text'
    );
  });
});
