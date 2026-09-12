/**
 * resumeParser.js
 * Parses uploaded resume files (PDF, DOCX, TXT, MD) and extracts structured
 * project claims, technologies, and technical experiences for the AI Interviewer.
 */

/**
 * Extracts resume text from an in-memory file buffer
 * @param {Object} file - Express Multer file object { buffer, originalname, mimetype }
 * @returns {Promise<string>} Clean extracted resume text
 */
export const extractResumeText = async (file) => {
  if (!file || !file.buffer) {
    throw new Error('No file buffer provided');
  }

  const { buffer, originalname = '', mimetype = '' } = file;
  const lowerName = originalname.toLowerCase();

  // 1. Plain Text or Markdown files
  if (
    mimetype === 'text/plain' ||
    mimetype === 'text/markdown' ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.md')
  ) {
    const text = buffer.toString('utf-8').trim();
    if (!text) throw new Error('Uploaded text file is empty');
    return text;
  }

  // 2. PDF & Document files via Gemini Document Extraction
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required to process PDF and document files');
  }

  const base64Data = buffer.toString('base64');
  const docMimeType = lowerName.endsWith('.pdf') ? 'application/pdf' : mimetype || 'application/pdf';

  const extractionPrompt =
    'You are a technical recruiting assistant preparing a candidate profile for a software engineering mock interview.\n' +
    'Extract and organize all technical details from this resume into clean, structured markdown bullets:\n' +
    '1. Candidate Name & Target Role\n' +
    '2. Core Technical Skills & Languages\n' +
    '3. Key Projects (Include project name, architecture, technologies used, and key features/metrics)\n' +
    '4. Work Experience & Achievements\n' +
    '5. Education\n\n' +
    'Keep the output concise, factual, and strictly faithful to the document.';

  const model = process.env.GEMINI_LLM_MODEL || 'gemini-3.6-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: docMimeType,
                data: base64Data,
              },
            },
            {
              text: extractionPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Document extraction failed (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!extractedText || !extractedText.trim()) {
    throw new Error('Could not extract readable text from the uploaded document');
  }

  return extractedText.trim();
};
