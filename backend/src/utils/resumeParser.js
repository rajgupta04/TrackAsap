/**
 * resumeParser.js
 * Parses uploaded resume files (PDF, DOCX, TXT, MD) using local high-speed parsers
 * (pdf-parse and mammoth) with Gemini / Groq document fallback and profile structuring.
 */

import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Clean up and structure raw text into readable markdown profile using LLM
 * If LLM call fails or times out, safely returns the raw text directly.
 */
const structureResumeWithLLM = async (rawText) => {
  if (!rawText || rawText.length < 30) return rawText;

  const prompt =
    'You are a technical recruiting assistant preparing a candidate profile for a software engineering mock interview.\n' +
    'Extract and organize the key technical details from this resume into clean, structured markdown bullets:\n' +
    '1. Candidate Name & Target Role\n' +
    '2. Core Technical Skills & Languages\n' +
    '3. Key Projects (Include project name, architecture, technologies used, and key features/metrics)\n' +
    '4. Work Experience & Achievements\n' +
    '5. Education\n\n' +
    'RESUME TEXT:\n"""\n' +
    rawText.slice(0, 8000) +
    '\n"""\n\n' +
    'Keep it concise, factual, and strictly faithful to the provided text.';

  // 1. Try Groq first (fastest, ~1s)
  if (process.env.GROQ_API_KEY) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.GROQ_LLM_MODEL || 'qwen/qwen3.8-27b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && content.trim()) return content.trim();
      }
    } catch (e) {
      console.warn('Groq resume structuring skipped:', e.message);
    }
  }

  // 2. Try Gemini fallback
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = process.env.GEMINI_LLM_MODEL || 'gemini-3.6-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content && content.trim()) return content.trim();
      }
    } catch (e) {
      console.warn('Gemini resume structuring skipped:', e.message);
    }
  }

  // Fallback: return raw text directly
  return rawText.trim();
};

/**
 * Extracts resume text from an in-memory file buffer (PDF, DOCX, TXT, MD)
 * @param {Object} file - Express Multer file object { buffer, originalname, mimetype }
 * @returns {Promise<string>} Clean extracted resume text
 */
export const extractResumeText = async (file) => {
  if (!file || !file.buffer) {
    throw new Error('No file buffer provided');
  }

  const { buffer, originalname = '', mimetype = '' } = file;
  const lowerName = originalname.toLowerCase();
  let rawText = '';

  // 1. Plain Text or Markdown files
  if (
    mimetype === 'text/plain' ||
    mimetype === 'text/markdown' ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.md')
  ) {
    rawText = buffer.toString('utf-8').trim();
  }
  // 2. Word Documents (.docx, .doc) via Mammoth
  else if (
    mimetype.includes('word') ||
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.doc')
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value || '';
    } catch (docxErr) {
      console.warn('Mammoth docx parse error:', docxErr.message);
    }
  }
  // 3. PDF Documents (.pdf) via local PDFParse + Gemini fallback
  else if (mimetype === 'application/pdf' || lowerName.endsWith('.pdf')) {
    // Step A: Local high-speed PDFParse (no network dependency)
    try {
      const parser = new PDFParse({ data: buffer });
      await parser.load();
      const result = await parser.getText();
      rawText = result?.text || '';
    } catch (pdfErr) {
      console.warn('Local PDFParse error, falling back to Gemini API:', pdfErr.message);
    }

    // Step B: If local PDF parser returned empty (e.g. scanned doc), try Gemini Document API
    if (!rawText || rawText.trim().length < 20) {
      if (process.env.GEMINI_API_KEY) {
        try {
          const model = process.env.GEMINI_LLM_MODEL || 'gemini-3.6-flash';
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: 'application/pdf',
                        data: buffer.toString('base64'),
                      },
                    },
                    {
                      text: 'Extract all text, projects, technologies, and experience from this resume in clean markdown bullets.',
                    },
                  ],
                },
              ],
              generationConfig: { temperature: 0.2 },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const extracted = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (extracted && extracted.trim()) {
              return extracted.trim();
            }
          }
        } catch (geminiErr) {
          console.warn('Gemini PDF extraction error:', geminiErr.message);
        }
      }
    }
  }
  // 4. Generic binary/text fallback
  else {
    try {
      rawText = buffer.toString('utf-8').trim();
    } catch (e) {}
  }

  // Clean rawText
  const cleaned = (rawText || '').replace(/\r\n/g, '\n').trim();

  if (!cleaned || cleaned.length < 5) {
    throw new Error(
      'Could not extract text from this document. If your resume is an image scan, please copy and paste the text using the "Paste Text" tab.'
    );
  }

  // Structure with LLM if possible, otherwise fallback safely to cleaned text
  try {
    const structured = await structureResumeWithLLM(cleaned);
    return structured || cleaned;
  } catch (err) {
    return cleaned;
  }
};
