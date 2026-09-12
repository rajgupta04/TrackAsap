/**
 * interviewConversationalAgent.js
 *
 * Real-time dynamic conversational AI interviewer engine for TrackAsap.
 * Provides tailored, mode-specific opening questions and generates dynamic,
 * context-aware follow-up turns using Groq (qwen/qwen3.8-27b) with seamless
 * fallback to Gemini (gemini-3.6-flash).
 */

const MODE_DEFINITIONS = {
  dsa_interview: {
    title: 'Verbal DSA & Algorithmic Problem Solving',
    persona:
      'You are a rigorous algorithms and data structures technical interviewer at a top tech company. ' +
      'This is a VERBAL DSA interview—the candidate explains intuition, algorithm choice, edge cases, and Big-O complexity out loud without writing code. ' +
      'Keep your responses to 1-3 spoken conversational sentences. Acknowledge their idea, challenge edge cases (e.g. negative numbers, empty array, overflow), and ask for precise time and space complexity.',
    defaultFirstQuestion: (name, role, company) =>
      `Hello ${name}! Welcome to your Verbal DSA and Problem Solving round for ${role}${company ? ` at ${company}` : ''}. Today we will explore algorithmic intuition, data structure selection, and Big-O complexity out loud without writing code. Let's dive right into your first problem: suppose you are given an integer array and need to find the contiguous subarray with the largest sum in linear time. What algorithmic approach comes to mind first, and how would you explain your intuition?`,
  },
  system_design: {
    title: 'System Design & Scalability',
    persona:
      'You are a Principal Infrastructure Architect conducting a high-level System Design interview. ' +
      'Focus on scale, distributed consensus, data storage (SQL vs NoSQL), caching strategies, load balancing, message queues, and single points of failure. ' +
      'Keep your spoken responses to 1-3 sentences. Challenge assumptions and ask what happens when traffic spikes 50x.',
    defaultFirstQuestion: (name, role, company) =>
      `Hello ${name}! Welcome to your System Design and Scalability round for ${role}${company ? ` at ${company}` : ''}. Today we will architect a high-scale distributed system from scratch. Imagine you are tasked with designing a real-time Notification Service or a distributed Rate Limiter that must support 100,000 requests per second with high availability. How would you begin by defining the functional and non-functional requirements?`,
  },
  backend_interview: {
    title: 'Backend Engineering',
    persona:
      'You are a Senior Backend Engineering Interviewer specializing in high-throughput server systems, databases, APIs, and security. ' +
      'Drill into Node.js event loop / concurrency, SQL indexing (B-trees) vs NoSQL document stores, Redis caching invalidation, connection pooling, and JWT/OAuth security. ' +
      'Keep responses to 1-3 punchy spoken sentences.',
    defaultFirstQuestion: (name, role, company) =>
      `Hello ${name}! Welcome to the Backend Engineering technical round for ${role}${company ? ` at ${company}` : ''}. We'll focus on server runtimes, database indexing, caching layers, and API resilience. To kick off: when architecting a high-throughput backend API in Node.js or Go, how do you manage asynchronous I/O and prevent database connection exhaustion under burst traffic?`,
  },
  resume_interview: {
    title: 'Resume & Projects Deep Dive',
    persona:
      'You are an Engineering Hiring Manager conducting an in-depth technical drill into the candidate’s actual resume and projects. ' +
      'Probe deep into architectural choices, their personal contributions vs team work, database schemas, and production bugs they resolved. ' +
      'Keep responses to 1-3 spoken sentences. Ask "Why did you build it that way instead of using standard solutions?"',
    defaultFirstQuestion: (name, role, company, resumeText) => {
      if (resumeText && resumeText.length > 50) {
        return `Hello ${name}! Welcome to your Resume and Project Deep-Dive for ${role}. I have reviewed your resume and background. Let's jump straight into your flagship engineering project: walk me through the high-level architecture, your individual contribution, and the most complex technical hurdle you had to solve.`;
      }
      return `Hello ${name}! Welcome to your Resume and Project Deep-Dive for ${role}. Let's jump right into your most technically challenging project: walk me through the system architecture, the tech stack decisions you made, and what went wrong during development.`;
    },
  },
  jd_interview: {
    title: 'Job Description Calibrated Interview',
    persona:
      'You are a Lead Hiring Engineer interviewing a candidate specifically against the requirements in the provided Job Description. ' +
      'Validate hands-on proficiency with the required skills, libraries, and architectural paradigms mentioned in the JD. ' +
      'Keep responses to 1-3 spoken sentences.',
    defaultFirstQuestion: (name, role, company, resumeText, jobDescription) =>
      `Hello ${name}! Welcome to your technical interview for ${role}${company ? ` at ${company}` : ''}. I have calibrated our interview specifically to the requirements of this job description. To start off, could you highlight how your hands-on production experience directly aligns with the core technical requirements of this role?`,
  },
  general_sde: {
    title: 'General SDE Comprehensive Round',
    persona:
      'You are a Senior SDE Interviewer conducting a well-rounded software engineering interview covering CS fundamentals, problem-solving, architectural trade-offs, and engineering judgment. ' +
      'Keep responses to 1-3 spoken conversational sentences.',
    defaultFirstQuestion: (name, role, company) =>
      `Hello ${name}! Welcome to your General SDE mock interview for ${role}${company ? ` at ${company}` : ''}. We'll cover computer science core concepts, algorithmic problem solving, and engineering trade-offs. To get started, could you give a brief 60-second introduction of your technical background and your favorite engineering challenge to date?`,
  },
};

/**
 * Returns the mode-tailored opening question
 */
export const getInitialQuestion = (session, user) => {
  const modeKey = session?.mode || 'general_sde';
  const modeConfig = MODE_DEFINITIONS[modeKey] || MODE_DEFINITIONS.general_sde;
  const name = user?.name?.split(' ')?.[0] || 'there';
  const role = session?.targetRole || 'Software Development Engineer';
  const company = session?.targetCompany || '';
  const resumeText = session?.resumeText || '';
  const jobDescription = session?.jobDescription || '';

  return modeConfig.defaultFirstQuestion(name, role, company, resumeText, jobDescription);
};

/**
 * Call Groq API for dynamic conversation turn
 */
const callGroqTurn = async (messages, systemPrompt) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

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
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 220,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq returned ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Empty response from Groq');
  return content;
};

/**
 * Call Gemini API as seamless fallback
 */
const callGeminiTurn = async (messages, systemPrompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const model = process.env.GEMINI_LLM_MODEL || 'gemini-3.6-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Format history for Gemini
  const conversationSummary = messages
    .map((m) => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
    .join('\n');

  const fullPrompt = `${systemPrompt}\n\nCONVERSATION TRANSCRIPT SO FAR:\n${conversationSummary}\n\nNow respond as the interviewer in 1-3 spoken sentences:`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini returned ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('Empty response from Gemini');
  return text;
};

/**
 * Generates the next dynamic interviewer turn
 */
export const generateNextInterviewTurn = async (session, transcript = [], candidateAnswer = '') => {
  const modeKey = session?.mode || 'general_sde';
  const modeConfig = MODE_DEFINITIONS[modeKey] || MODE_DEFINITIONS.general_sde;
  const role = session?.targetRole || 'Software Development Engineer';
  const company = session?.targetCompany ? ` at ${session.targetCompany}` : '';
  const resumeText = session?.resumeText ? `\n\nCANDIDATE RESUME SUMMARY:\n${session.resumeText.slice(0, 1500)}` : '';
  const jdText = session?.jobDescription ? `\n\nTARGET JOB DESCRIPTION:\n${session.jobDescription.slice(0, 1500)}` : '';

  const systemPrompt = `You are conducting a live, spoken voice mock interview for a ${role}${company} position.
Active Interview Mode: "${modeConfig.title}".
${modeConfig.persona}${resumeText}${jdText}

STRICT VOICE CONVERSATION RULES:
1. Speak concisely in 1 to 3 natural sentences maximum (this is spoken via text-to-speech).
2. Directly acknowledge the candidate's previous response with constructive feedback or technical critique.
3. Ask ONE crisp, high-impact follow-up question that drills deeper into their technical answer or presents a concrete edge case / trade-off.
4. If in Verbal DSA mode, stay 100% on algorithmic intuition, data structures, and Big-O complexity.
5. If in System Design mode, probe scale, bottlenecks, database sharding, caching, and single points of failure.
6. If in Backend mode, probe runtime internals, database indexing, caching strategies, and security.
7. If in Resume mode, challenge their actual project claims.
8. Never repeat previous questions from the transcript. Do NOT give long lectures.`;

  // Build message history (last 8 turns for tight latency)
  const recentTurns = transcript.slice(-8);
  const messages = [];

  for (const turn of recentTurns) {
    messages.push({
      role: turn.speaker === 'ai' ? 'assistant' : 'user',
      content: turn.text || '',
    });
  }

  // Ensure latest candidate answer is included if not in transcript yet
  if (candidateAnswer && (!messages.length || messages[messages.length - 1].content !== candidateAnswer)) {
    messages.push({
      role: 'user',
      content: candidateAnswer,
    });
  }

  // 1. Try Groq (ultra low latency)
  try {
    const aiText = await callGroqTurn(messages, systemPrompt);
    return {
      aiResponse: cleanSpokenText(aiText),
      section: mapSectionFromMode(modeKey, messages.length),
    };
  } catch (groqErr) {
    console.warn('Groq dynamic turn failed, trying Gemini:', groqErr.message);
  }

  // 2. Fallback to Gemini 3.6 Flash
  try {
    const aiText = await callGeminiTurn(messages, systemPrompt);
    return {
      aiResponse: cleanSpokenText(aiText),
      section: mapSectionFromMode(modeKey, messages.length),
    };
  } catch (geminiErr) {
    console.error('Gemini dynamic turn failed:', geminiErr.message);
  }

  // 3. Fallback to Mode-Specific Offline Matrix
  return getOfflineModeTurn(modeKey, candidateAnswer, messages.length);
};

/**
 * Clean LLM response for optimal speech synthesis
 */
const cleanSpokenText = (text) => {
  if (!text) return '';
  return text
    .replace(/^["']|["']$/g, '') // remove quotes
    .replace(/^(interviewer|ai):\s*/i, '') // remove speaker prefixes
    .replace(/\*\*/g, '') // remove markdown bold
    .replace(/\*/g, '')
    .trim();
};

const mapSectionFromMode = (mode, turnCount) => {
  if (turnCount <= 2) return 'intro';
  if (mode === 'dsa_interview') return turnCount > 6 ? 'complexity_analysis' : 'problem_solving';
  if (mode === 'system_design') return turnCount > 6 ? 'scaling_and_bottlenecks' : 'system_design';
  if (mode === 'backend_interview') return turnCount > 6 ? 'databases_and_caching' : 'technical';
  if (mode === 'resume_interview') return turnCount > 6 ? 'challenges_and_tradeoffs' : 'project_deepdive';
  return 'technical';
};

/**
 * Robust Mode-Specific Fallback Matrix (if LLM APIs are temporarily unreachable)
 */
const getOfflineModeTurn = (mode, candidateAnswer = '', turnCount = 0) => {
  const lower = candidateAnswer.toLowerCase();

  if (mode === 'dsa_interview') {
    if (lower.includes('kadane') || lower.includes('array') || lower.includes('subarray')) {
      return {
        aiResponse:
          "That makes sense with Kadane's algorithm. How does your logic handle an array where every single element is negative, and what is your exact Big-O time and space complexity?",
        section: 'problem_solving',
      };
    }
    if (lower.includes('negative') || lower.includes('hash') || lower.includes('map')) {
      return {
        aiResponse:
          'Good catch on the negative elements. Now, if we need to return the actual subarray indices rather than just the maximum sum, how would you adjust your pointer tracking?',
        section: 'complexity_analysis',
      };
    }
    if (turnCount > 4) {
      return {
        aiResponse:
          'Excellent analysis. What would be the worst-case space complexity if you were asked to solve this recursively using divide and conquer instead of iteratively?',
        section: 'complexity_analysis',
      };
    }
    return {
      aiResponse:
        'Understood. Could you walk me through an edge case with duplicates or an empty input, and confirm the Big-O time complexity?',
      section: 'problem_solving',
    };
  }

  if (mode === 'system_design') {
    if (lower.includes('database') || lower.includes('sql') || lower.includes('nosql')) {
      return {
        aiResponse:
          'That architectural choice makes sense for standard traffic. How would you partition or shard the data when daily writes exceed 100 million records?',
        section: 'system_design',
      };
    }
    if (lower.includes('cache') || lower.includes('redis')) {
      return {
        aiResponse:
          'Using a distributed cache is vital here. What eviction strategy would you configure, and how would you prevent cache stampede when popular keys expire simultaneously?',
        section: 'scaling_and_bottlenecks',
      };
    }
    return {
      aiResponse:
        'Good high-level breakdown. If this service suffered a sudden regional datacenter outage, how would your architecture guarantee high availability without data inconsistency?',
      section: 'system_design',
    };
  }

  if (mode === 'backend_interview') {
    if (lower.includes('mongo') || lower.includes('postgres') || lower.includes('index')) {
      return {
        aiResponse:
          'Indexes are crucial there. How do B-tree indexes behave differently under heavy writes compared to LSM trees, and how do you monitor slow query execution plans?',
        section: 'databases_and_caching',
      };
    }
    if (lower.includes('async') || lower.includes('event') || lower.includes('thread')) {
      return {
        aiResponse:
          'Right on the event loop mechanics. When CPU-intensive tasks block the main thread, how do you offload that work to keep the API responsive?',
        section: 'technical',
      };
    }
    return {
      aiResponse:
        'Solid points. How do you implement rate limiting and idempotency on financial or state-mutating endpoints to prevent duplicate charges?',
      section: 'technical',
    };
  }

  if (mode === 'resume_interview') {
    return {
      aiResponse:
        'Interesting. In that specific project, what was the biggest technical trade-off you made between development velocity and long-term architectural maintainability?',
      section: 'project_deepdive',
    };
  }

  return {
    aiResponse:
      'Good explanation. If you were building this from scratch today with 10x scale, what architectural component would you design differently?',
    section: 'technical',
  };
};
