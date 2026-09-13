/**
 * resumeParser.js
 *
 * Robust, fault-tolerant resume parsing pipeline supporting PDF, DOCX, DOC, TXT, and MD.
 * Employs a multi-tier extraction strategy:
 * 1. Local PDFParse v2 (high-speed local parsing via pdfjs-dist)
 * 2. Gemini Multi-Modal Document API (processes complex layouts, scans, and non-standard fonts)
 * 3. PDF Stream Token Extractor (extracts Tj/TJ text tokens directly from raw binary)
 * 4. Mammoth (Word .docx format)
 * 5. Printable String Sanitizer (universal binary fallback)
 * 6. LLM Structuring (Groq / Gemini) with zero-failure fallback
 */

import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extracts printable textual sequences from raw binary buffers as a safety net
 */
const extractPrintableStrings = (buffer) => {
  try {
    const text = buffer.toString('utf-8');
    const words = text.match(/[\w\s.,;:!?@#&()'"/+-]{4,}/g);
    if (!words || words.length === 0) return '';
    return words
      .map((w) => w.trim())
      .filter(
        (w) =>
          w.length > 3 &&
          !w.startsWith('<<') &&
          !w.endsWith('>>') &&
          !w.includes('/Font') &&
          !w.includes('/Type') &&
          !w.includes('/Filter') &&
          !w.includes('endstream') &&
          !w.includes('xref')
      )
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (e) {
    return '';
  }
};

/**
 * Extracts uncompressed text streams from PDF binary
 */
const extractPdfStreamStrings = (buffer) => {
  try {
    const str = buffer.toString('latin1');
    const parts = [];

    // Match text in parentheses followed by Tj operator: (Hello World) Tj
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(str)) !== null) {
      parts.push(match[1]);
    }

    // Match array format: [(Hello) -10 (World)] TJ
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    while ((match = tjArrayRegex.exec(str)) !== null) {
      const inner = match[1];
      const items = inner.match(/\(([^)]+)\)/g);
      if (items) {
        parts.push(items.map((it) => it.slice(1, -1)).join(''));
      }
    }

    return parts
      .join(' ')
      .replace(/\\([()\\])/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (e) {
    return '';
  }
};

/**
 * Calls Gemini Multi-Modal Document API with base64 inlineData (PDF, PNG, JPG, WEBP)
 */
const extractDocumentWithGemini = async (buffer, mimeType = 'application/pdf') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return '';

  const model = process.env.GEMINI_LLM_MODEL || 'gemini-3.6-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: buffer.toString('base64'),
                },
              },
              {
                text: 'Extract all candidate details, skills, programming languages, frameworks, work experience, education, and technical projects (including architecture and technologies used) from this resume document into clean markdown.',
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.2,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn('Gemini Document extraction returned non-ok:', res.status, err);
      return '';
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || '').join('\n').trim();
    return text || '';
  } catch (e) {
    console.warn('Gemini Document API exception:', e.message);
    return '';
  }
};

/**
 * Organizes extracted raw text into clean, structured markdown bullets using LLM
 * If LLM call fails or is unavailable, returns raw text immediately.
 */
const structureResumeWithLLM = async (rawText) => {
  if (!rawText || rawText.length < 40) return rawText;

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
          max_tokens: 1500,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && content.trim()) return content.trim();
      }
    } catch (e) {
      // Ignore and fallback
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
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.2,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const content = parts.map((p) => p.text || '').join('\n').trim();
        if (content) return content;
      }
    } catch (e) {
      // Ignore and fallback
    }
  }

  // Fallback: return raw text directly
  return rawText.trim();
};

/**
 * Extracts resume text from an in-memory file buffer (PDF, DOCX, DOC, TXT, MD, Images)
 * @param {Object} file - Express Multer file object { buffer, originalname, mimetype }
 * @returns {Promise<string>} Clean extracted resume text
 */
export const extractResumeText = async (file) => {
  if (!file || !file.buffer) {
    throw new Error('No resume file buffer received');
  }

  const { buffer, originalname = '', mimetype = '' } = file;
  const lowerName = originalname.toLowerCase();
  let rawText = '';

  // Case 1: Plain Text or Markdown files
  if (
    mimetype === 'text/plain' ||
    mimetype === 'text/markdown' ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.md')
  ) {
    rawText = buffer.toString('utf-8').trim();
  }
  // Case 2: Word Documents (.docx, .doc, .rtf) via Mammoth
  else if (
    mimetype.includes('word') ||
    mimetype.includes('officedocument') ||
    mimetype.includes('rtf') ||
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.doc') ||
    lowerName.endsWith('.rtf')
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value || '';
    } catch (docxErr) {
      console.warn('Mammoth docx parse error:', docxErr.message);
    }
  }
  // Case 3: Image formats (.png, .jpg, .jpeg, .webp) via Gemini Vision OCR
  else if (
    mimetype.startsWith('image/') ||
    /\.(png|jpe?g|webp)$/i.test(lowerName)
  ) {
    try {
      const imgMime = mimetype && mimetype.startsWith('image/')
        ? mimetype
        : (lowerName.endsWith('.png') ? 'image/png' : 'image/jpeg');
      const imgText = await extractDocumentWithGemini(buffer, imgMime);
      if (imgText && imgText.trim().length > 20) {
        rawText = imgText;
      }
    } catch (imgErr) {
      console.warn('Image extraction error:', imgErr.message);
    }
  }
  // Case 4: PDF Documents (.pdf)
  else if (
    mimetype === 'application/pdf' ||
    mimetype === 'application/x-pdf' ||
    lowerName.endsWith('.pdf')
  ) {
    // Tier 1: Local PDFParse
    try {
      const parser = new PDFParse({ data: buffer });
      await parser.load();
      const result = await parser.getText();
      rawText = result?.text || '';
    } catch (pdfErr) {
      console.warn('Local PDFParse error, trying fallbacks:', pdfErr.message);
    }

    // Tier 2: Gemini Document Multi-Modal API (for scanned documents / complex layouts)
    if (!rawText || rawText.trim().length < 30) {
      try {
        const geminiText = await extractDocumentWithGemini(buffer, 'application/pdf');
        if (geminiText && geminiText.trim().length > 30) {
          rawText = geminiText;
        }
      } catch (geminiErr) {
        console.warn('Gemini PDF extraction error:', geminiErr.message);
      }
    }

    // Tier 3: Direct PDF uncompressed stream extractor
    if (!rawText || rawText.trim().length < 30) {
      const streamText = extractPdfStreamStrings(buffer);
      if (streamText && streamText.trim().length > 30) {
        rawText = streamText;
      }
    }
  }

  // Tier 4: Universal fallback for any binary or unknown format
  if (!rawText || rawText.trim().length < 30) {
    const printable = extractPrintableStrings(buffer);
    if (printable && printable.length > 30) {
      rawText = printable;
    }
  }

  // Normalize extracted text
  const cleaned = (rawText || '')
    .replace(/\r\n/g, '\n')
    .replace(/\0/g, '')
    .trim();

  if (!cleaned || cleaned.length < 15) {
    throw new Error(
      'Could not extract text from this document. If your resume is an image scan, please copy and paste the text into the "Paste Text" box.'
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
