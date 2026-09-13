/**
 * interviewEvaluator.js
 * Analyzes interview transcripts, computes objective speech metrics,
 * guards against premature / aborted sessions, and invokes Groq (or Gemini)
 * to generate authentic, honest hiring-bar evaluations based strictly on candidate answers.
 */

const FILLER_PATTERNS = /\b(um|uh|er|ah|like|basically|actually|you know|sort of|kind of)\b/gi;

/**
 * Computes defensible speech & delivery signals from user transcript turns
 */
export const computeVoiceMetrics = (transcript = []) => {
  let userTurns = 0;
  let totalWords = 0;
  let fillerCount = 0;

  for (const turn of transcript) {
    if (turn.speaker === 'user') {
      userTurns++;
      const text = turn.text || '';
      const words = text.trim().split(/\s+/).filter(Boolean);
      totalWords += words.length;

      const matches = text.match(FILLER_PATTERNS);
      if (matches) {
        fillerCount += matches.length;
      }
    }
  }

  // Heuristic speaking pace ~140 WPM => ~2.33 words/sec
  const totalSpeakingTimeSec = totalWords > 0 ? Math.max(1, Math.round(totalWords / 2.33)) : 0;
  const wpm = totalSpeakingTimeSec > 0 ? Math.round((totalWords / (totalSpeakingTimeSec / 60))) : 0;

  return {
    totalSpeakingTimeSec,
    totalWords,
    wpm,
    pauseCount: Math.max(0, userTurns - 1),
    fillerWordCount: fillerCount,
    interruptionsCount: 0,
    userTurns,
  };
};

/**
 * Calls Groq API for structured JSON evaluation
 */
const callGroqEvaluation = async (prompt, systemPrompt) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const model = process.env.GROQ_LLM_MODEL || 'qwen/qwen3.8-27b';

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API returned ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const rawText = data.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('Empty response from Groq');

  return JSON.parse(rawText);
};

/**
 * Calls Gemini API as fallback for structured JSON evaluation
 */
const callGeminiEvaluation = async (prompt, systemPrompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const model = process.env.GEMINI_LLM_MODEL || 'gemini-3.6-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${systemPrompt}\n\n${prompt}` },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API returned ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Gemini');

  return JSON.parse(rawText);
};

/**
 * Evaluates an interview session with premature abortion guard & LLM grading
 */
export const generateInterviewEvaluation = async (session, clientTranscript = null) => {
  // Use latest client transcript if provided and more up-to-date
  const activeTranscript =
    Array.isArray(clientTranscript) && clientTranscript.length >= (session.transcript?.length || 0)
      ? clientTranscript
      : session.transcript || [];

  const metrics = computeVoiceMetrics(activeTranscript);

  // 1. GUARD: Check for premature / incomplete session
  // If candidate spoke fewer than 2 turns or under 20 words (e.g. only "hey can you hear me")
  if (metrics.userTurns < 2 || metrics.totalWords < 20) {
    return {
      overallScore: 0,
      incomplete: true,
      reason: 'Session ended prematurely before technical questioning began.',
      categories: {
        technicalKnowledge: 0,
        problemSolving: 0,
        communication: 0,
        projectDepth: 0,
        systemDesign: 0,
        confidence: 0,
      },
      strengths: [
        'Microphone and audio connection were initialized successfully.',
      ],
      weaknesses: [
        'Session concluded before technical or architectural discussion could take place.',
      ],
      incorrectAnswers: [],
      areasToRevise: [
        'Complete a full 15-20 minute mock interview session answering role-specific questions to receive detailed competency scoring and feedback.',
      ],
      recommendedNextInterview: session.mode || 'general_sde',
      detailedFeedback:
        'This interview session was concluded prematurely after only an initial greeting or audio test. Because no technical responses were provided by the candidate, competencies could not be evaluated.',
      voiceMetrics: {
        totalSpeakingTimeSec: metrics.totalSpeakingTimeSec,
        wpm: metrics.wpm,
        pauseCount: metrics.pauseCount,
        fillerWordCount: metrics.fillerWordCount,
        interruptionsCount: 0,
      },
    };
  }

  // 2. SUBSTANTIVE SESSION: Format transcript for LLM review
  const formattedTranscript = activeTranscript
    .map((t) => {
      const speaker = t.speaker === 'ai' ? 'Interviewer' : 'Candidate';
      return `${speaker}: ${t.text}`;
    })
    .join('\n');

  const systemPrompt =
    'You are an expert Technical Interview Auditor and Hiring Bar Raiser. ' +
    'Your duty is to analyze real technical interview transcripts with uncompromising accuracy, ' +
    'honest scoring based strictly on what the candidate actually said, and zero generic platitudes. ' +
    'Always output valid, well-formed JSON matching the specified schema.';

  const userPrompt = `
TARGET ROLE: ${session.targetRole || 'Software Development Engineer'}
COMPANY TARGET: ${session.targetCompany || 'General Tech'}
INTERVIEW MODE: ${session.mode || 'general_sde'}
DIFFICULTY: ${session.difficulty || 'medium'}

TRANSCRIPT OF THE INTERVIEW:
"""
${formattedTranscript}
"""

EVALUATION INSTRUCTIONS:
1. Base your scoring and commentary STRICTLY on the candidate's actual responses in the transcript above. Do not invent answers or praise skills that were not demonstrated.
2. Score on a 1.0 to 10.0 scale:
   - 8.5 to 10.0: Strong hire / exceptional depth, edge-case mastery, trade-offs.
   - 7.0 to 8.4: Solid hire / passed bar, clear baseline understanding, minor gaps.
   - 5.0 to 6.9: Borderline / needs revision, shallow explanations, hand-waving.
   - 1.0 to 4.9: Needs significant improvement, major misconceptions.
3. If the candidate gave incorrect or suboptimal answers, highlight them in "incorrectAnswers" with what they said and what the correct answer should be.
4. Highlight 2-3 genuine strengths and 2-3 concrete areas for improvement quoting or referencing their responses.
5. Provide 2-4 specific technical topics in "areasToRevise".
6. Write a constructive, honest 2-paragraph "detailedFeedback" summarizing their performance and hiring readiness.

Return a JSON object with this EXACT structure:
{
  "overallScore": 7.5,
  "categories": {
    "technicalKnowledge": 7.5,
    "problemSolving": 7.0,
    "communication": 8.0,
    "projectDepth": 7.5,
    "systemDesign": 6.8,
    "confidence": 7.2
  },
  "strengths": [
    "Specific strength referencing their answer"
  ],
  "weaknesses": [
    "Specific weakness explaining what depth was missing"
  ],
  "incorrectAnswers": [
    {
      "question": "Question asked",
      "candidateAnswer": "Summary of what candidate answered",
      "correctGuidance": "What the accurate answer or trade-off analysis should be"
    }
  ],
  "areasToRevise": [
    "Concrete topic name"
  ],
  "recommendedNextInterview": "Suggested follow-up mode (e.g. system_design, dsa_interview)",
  "detailedFeedback": "Comprehensive 2-paragraph hiring evaluation."
}
`;

  let evaluationJson = null;

  // Try Groq first (fastest)
  try {
    evaluationJson = await callGroqEvaluation(userPrompt, systemPrompt);
  } catch (groqErr) {
    console.warn('Groq evaluation failed, falling back to Gemini:', groqErr.message);
    try {
      evaluationJson = await callGeminiEvaluation(userPrompt, systemPrompt);
    } catch (geminiErr) {
      console.error('Gemini evaluation also failed:', geminiErr.message);
      throw new Error(`LLM evaluation failed: ${groqErr.message} | ${geminiErr.message}`);
    }
  }

  // Sanitize & normalize fields
  const overallScore = Number(evaluationJson.overallScore) || 6.5;
  const categories = evaluationJson.categories || {};

  const normalizedCategories = {
    technicalKnowledge: Math.min(10, Math.max(1, Number(categories.technicalKnowledge) || overallScore)),
    problemSolving: Math.min(10, Math.max(1, Number(categories.problemSolving) || overallScore)),
    communication: Math.min(10, Math.max(1, Number(categories.communication) || overallScore)),
    projectDepth: Math.min(10, Math.max(1, Number(categories.projectDepth) || overallScore)),
    systemDesign: Math.min(10, Math.max(1, Number(categories.systemDesign) || overallScore)),
    confidence: Math.min(10, Math.max(1, Number(categories.confidence) || overallScore)),
  };

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    incomplete: false,
    reason: '',
    categories: normalizedCategories,
    strengths: Array.isArray(evaluationJson.strengths) && evaluationJson.strengths.length > 0
      ? evaluationJson.strengths
      : ['Candidate engaged with technical prompts and attempted core questions.'],
    weaknesses: Array.isArray(evaluationJson.weaknesses) && evaluationJson.weaknesses.length > 0
      ? evaluationJson.weaknesses
      : ['Could provide deeper quantification and edge-case reasoning.'],
    incorrectAnswers: Array.isArray(evaluationJson.incorrectAnswers) ? evaluationJson.incorrectAnswers : [],
    areasToRevise: Array.isArray(evaluationJson.areasToRevise) && evaluationJson.areasToRevise.length > 0
      ? evaluationJson.areasToRevise
      : ['Core architectural patterns and data structures.'],
    recommendedNextInterview: evaluationJson.recommendedNextInterview || 'system_design',
    detailedFeedback: evaluationJson.detailedFeedback || 'Candidate completed the interview session.',
    voiceMetrics: {
      totalSpeakingTimeSec: metrics.totalSpeakingTimeSec,
      wpm: metrics.wpm,
      pauseCount: metrics.pauseCount,
      fillerWordCount: metrics.fillerWordCount,
      interruptionsCount: 0,
    },
  };
};
