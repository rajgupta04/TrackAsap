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
      'Keep your responses to 1-3 spoken conversational sentences. Acknowledge their idea, challenge edge cases, and ask for precise time and space complexity.',
  },
  system_design: {
    title: 'System Design & Scalability',
    persona:
      'You are a Principal Infrastructure Architect conducting a high-level System Design interview. ' +
      'Focus on scale, distributed consensus, data storage (SQL vs NoSQL), caching strategies, load balancing, message queues, and single points of failure. ' +
      'Keep your spoken responses to 1-3 sentences. Challenge assumptions and ask what happens when traffic spikes 50x.',
  },
  backend_interview: {
    title: 'Backend Engineering',
    persona:
      'You are a Senior Backend Engineering Interviewer specializing in high-throughput server systems, databases, APIs, and security. ' +
      'Drill into Node.js event loop / concurrency, SQL indexing (B-trees) vs NoSQL document stores, Redis caching invalidation, connection pooling, and JWT/OAuth security. ' +
      'Keep responses to 1-3 punchy spoken sentences.',
  },
  resume_interview: {
    title: 'Resume & Projects Deep Dive',
    persona:
      'You are an Engineering Hiring Manager conducting an in-depth technical drill into the candidate’s actual resume and projects. ' +
      'Probe deep into architectural choices, their personal contributions vs team work, database schemas, and production bugs they resolved. ' +
      'Keep responses to 1-3 spoken sentences. Ask "Why did you build it that way instead of using standard solutions?"',
  },
  jd_interview: {
    title: 'Job Description Calibrated Interview',
    persona:
      'You are a Lead Hiring Engineer interviewing a candidate specifically against the requirements in the provided Job Description. ' +
      'Validate hands-on proficiency with the required skills, libraries, and architectural paradigms mentioned in the JD. ' +
      'Keep responses to 1-3 spoken sentences.',
  },
  general_sde: {
    title: 'General SDE Comprehensive Round',
    persona:
      'You are a Senior SDE Interviewer conducting a well-rounded software engineering interview covering CS fundamentals, problem-solving, architectural trade-offs, and engineering judgment. ' +
      'Keep responses to 1-3 spoken conversational sentences.',
  },
};

/**
 * Diverse Fallback Question Pool (randomized to guarantee fresh questions even offline)
 */
const FALLBACK_POOLS = {
  dsa_interview: [
    (name) => `Hello ${name}! Welcome to your Verbal DSA round. Let's start with an algorithmic problem: suppose you are given a string of characters and need to find the length of the longest contiguous substring without any repeating characters. What algorithmic approach and data structures come to mind first?`,
    (name) => `Hello ${name}! Welcome to your Verbal DSA round. Here is your first problem: you are given an array of intervals representing meeting schedules, and you need to merge all overlapping intervals into the minimum number of slots. How would you solve this, and what is your time complexity?`,
    (name) => `Hello ${name}! Welcome to your Verbal DSA interview. Let's jump into your first challenge: suppose you have an array representing elevation heights, and you need to compute how much rainwater can be trapped after raining. What intuition and pointer technique would you use?`,
    (name) => `Hello ${name}! Welcome to your Verbal DSA round. Imagine you are given a directed graph of course prerequisites and need to find an ordering in which all courses can be taken, or detect if a circular cycle exists. How would you approach this algorithmically?`,
    (name) => `Hello ${name}! Welcome to your Verbal DSA round. Consider an unsorted integer array where you need to find the Kth largest element in expected linear time without fully sorting the array. Which data structure or partitioning algorithm would you select?`,
    (name) => `Hello ${name}! Welcome to your Verbal DSA round. Suppose you are given an integer array that was originally sorted in ascending order but has been rotated at an unknown pivot. How would you search for a target value in logarithmic time?`,
    (name) => `Hello ${name}! Welcome to your Verbal DSA round. Suppose you are given a binary tree and two target nodes. How would you find their Lowest Common Ancestor efficiently, and what are your time and space bounds?`,
    (name) => `Hello ${name}! Welcome to your Verbal DSA round. Let's begin with a classic problem: suppose you are given an integer array and need to find the contiguous subarray with the largest sum in linear time. What algorithmic approach comes to mind first, and how would you explain your intuition?`,
  ],
  system_design: [
    (name) => `Hello ${name}! Welcome to your System Design round. Today let's architect a distributed URL Shortener service like TinyURL that generates short aliases and handles 50,000 read requests per second. How would you start by defining functional requirements and estimating storage?`,
    (name) => `Hello ${name}! Welcome to your System Design round. Imagine you are tasked with designing a real-time collaborative document editing system like Google Docs where multiple users edit simultaneously. What data synchronization models or conflict resolution techniques would you consider?`,
    (name) => `Hello ${name}! Welcome to your System Design round. Let's design a high-throughput Distributed Rate Limiter that protects our API gateway across multiple global data centers. How would you manage rate limit counters and minimize latency?`,
    (name) => `Hello ${name}! Welcome to your System Design round. Imagine we are building a video streaming platform like YouTube. How would you design the video ingestion, transcoding pipeline, and CDN delivery strategy for low latency playback?`,
    (name) => `Hello ${name}! Welcome to your System Design round. Today let's architect a proximity service like Yelp or Uber that returns nearby drivers or restaurants within a 5-mile radius with sub-50ms latency. How would you index geospatial coordinates?`,
    (name) => `Hello ${name}! Welcome to your System Design round. Let's design a distributed notification engine that dispatches push notifications, SMS, and emails to tens of millions of users daily with at-least-once delivery guarantees. How would you architect the message queue and worker layers?`,
  ],
  backend_interview: [
    (name) => `Hello ${name}! Welcome to your Backend Engineering round. To kick off: when architecting a high-throughput backend API in Node.js or Go, how do you manage asynchronous I/O and prevent database connection exhaustion under burst traffic?`,
    (name) => `Hello ${name}! Welcome to your Backend Engineering round. In distributed payment systems, how do you guarantee idempotency on mutating financial transactions to ensure network timeouts never trigger duplicate charges?`,
    (name) => `Hello ${name}! Welcome to your Backend Engineering round. Suppose your production database CPU spikes to 100% due to slow queries. Walk me through how you would inspect query execution plans and optimize B-tree indexes.`,
    (name) => `Hello ${name}! Welcome to your Backend Engineering round. How do you implement a distributed cache invalidation strategy with Redis that prevents both cache stampedes and stale data under high write concurrency?`,
    (name) => `Hello ${name}! Welcome to your Backend Engineering round. When migrating database schemas with millions of active rows in a zero-downtime production environment, what deployment strategy and schema versioning approach do you use?`,
  ],
  resume_interview: [
    (name) => `Hello ${name}! Welcome to your Resume and Project Deep-Dive. Walk me through your most technically complex software project: what was the core architecture, what technical trade-offs did you make, and how did you measure performance?`,
    (name) => `Hello ${name}! Welcome to your Resume Deep-Dive. Looking across your technical background, what has been the most challenging production outage or latency bottleneck you personally diagnosed and resolved?`,
    (name) => `Hello ${name}! Welcome to your Project Deep-Dive. Choose an architectural decision you made in your past work that you would design differently today in hindsight, and explain why.`,
  ],
  jd_interview: [
    (name) => `Hello ${name}! Welcome to your technical interview calibrated to this job description. To start, how does your hands-on production experience directly align with the core technical architecture and responsibilities of this role?`,
    (name) => `Hello ${name}! Welcome to your interview. Based on the target engineering requirements for this position, what is your approach to designing resilient, maintainable services that scale with team and traffic growth?`,
  ],
  general_sde: [
    (name) => `Hello ${name}! Welcome to your General SDE interview. To start us off, could you give a brief 60-second summary of your technical background and highlight the most interesting engineering challenge you have tackled?`,
    (name) => `Hello ${name}! Welcome to your SDE round. In high-performance backend systems, how do you evaluate the architectural trade-offs between a modular monolith and microservices for a growing engineering team?`,
    (name) => `Hello ${name}! Welcome to your General SDE interview. Let's begin with a core systems question: how does the operating system event loop and thread scheduling differ between CPU-bound workloads and I/O-bound microservices?`,
  ],
};

const getRandomPoolQuestion = (modeKey, name) => {
  const pool = FALLBACK_POOLS[modeKey] || FALLBACK_POOLS.general_sde;
  const picker = pool[Math.floor(Math.random() * pool.length)];
  return picker(name);
};

/**
 * Returns a dynamic, mode-tailored opening question generated via LLM (Groq / Gemini)
 * with randomized fallback pool to ensure every session has a unique question.
 */
export const getInitialQuestion = async (session, user) => {
  const modeKey = session?.mode || 'general_sde';
  const modeConfig = MODE_DEFINITIONS[modeKey] || MODE_DEFINITIONS.general_sde;
  const name = user?.name?.split(' ')?.[0] || 'there';
  const role = session?.targetRole || 'Software Development Engineer';
  const company = session?.targetCompany ? ` at ${session.targetCompany}` : '';
  const difficulty = session?.difficulty || 'medium';
  const resumeText = session?.resumeText ? `\n\nCANDIDATE RESUME PROFILE:\n${session.resumeText.slice(0, 1200)}` : '';
  const jdText = session?.jobDescription ? `\n\nTARGET JOB SPECIFICATION:\n${session.jobDescription.slice(0, 1200)}` : '';

  // Mode-specific dynamic generation directives
  let modeDirective = '';
  if (modeKey === 'dsa_interview') {
    const dsaTopics = [
      'Sliding Window (e.g. longest substring, minimum window substring)',
      'Binary Search on Answer Space (e.g. capacity to ship packages, aggressive cows)',
      'Dynamic Programming (e.g. coin change, word break, house robber)',
      'Topological Sort and Graphs (e.g. course schedule, alien dictionary)',
      'Trees and Binary Search Trees (e.g. lowest common ancestor, diameter of binary tree)',
      'Monotonic Stack or Queue (e.g. next greater element, daily temperatures)',
      'Two Pointers (e.g. 3Sum, container with most water, remove duplicates)',
      'Heaps and Priority Queues (e.g. merge k sorted lists, find median from data stream)',
      'Intervals (e.g. merge intervals, insert interval, meeting rooms)',
    ];
    const chosenTopic = dsaTopics[Math.floor(Math.random() * dsaTopics.length)];
    modeDirective =
      `Pick an interview problem on the topic of: ${chosenTopic}. ` +
      `Calibrate to ${difficulty} difficulty. ` +
      'Describe the scenario clearly in 2 spoken sentences and ask the candidate for their intuition, data structure choice, and time complexity out loud without writing code.';
  } else if (modeKey === 'system_design') {
    const sysTopics = [
      'Distributed Key-Value Store with partition tolerance and tunable consistency',
      'URL Shortener service like TinyURL at 100k requests/sec',
      'Video Ingestion and Transcoding Pipeline like YouTube',
      'Distributed Rate Limiter across multiple cloud regions',
      'Proximity / Ride-Sharing Dispatch Service like Uber with sub-50ms driver matching',
      'Real-Time Chat & Messaging Infrastructure like WhatsApp with message ordering',
      'Metrics Aggregation and Alerting Dashboard like Datadog',
      'Collaborative Document Editing System like Google Docs using CRDT or OT',
    ];
    const chosenSys = sysTopics[Math.floor(Math.random() * sysTopics.length)];
    modeDirective =
      `Scenario: Architect a ${chosenSys}. ` +
      `Target a ${difficulty} scale challenge. Ask the candidate to define the core functional requirements and propose an initial high-level architecture.`;
  } else if (modeKey === 'backend_interview') {
    const backendTopics = [
      'Handling database deadlocks and row-level locking under high concurrent write loads',
      'Preventing cache stampede and thundering herd when high-traffic Redis keys expire',
      'Connection pooling saturation and managing database thread pools under traffic bursts',
      'Designing idempotent payment processing webhooks to prevent duplicate charges',
      'Evaluating B-tree vs LSM tree database index performance for write-heavy services',
      'Zero-downtime database schema migrations with multi-version API support',
      'Asynchronous task workers with retry policies, exponential backoff, and dead-letter queues',
    ];
    const chosenBackend = backendTopics[Math.floor(Math.random() * backendTopics.length)];
    modeDirective =
      `Scenario: ${chosenBackend}. ` +
      `Target ${difficulty} level. Formulate a real-world engineering scenario and ask how they would diagnose or architect the solution.`;
  } else if (modeKey === 'resume_interview') {
    modeDirective =
      'Inspect the provided candidate resume profile. Pick ONE specific project, architecture claim, or technology stack mentioned. ' +
      'Ask an insightful, probing engineering question about why they chose that architecture, how it scaled, or a major technical bottleneck they encountered.';
  } else if (modeKey === 'jd_interview') {
    modeDirective =
      'Inspect the target job specification. Formulate a high-impact opening question directly assessing their real-world production experience with the key requirements and architectural patterns described.';
  } else {
    modeDirective =
      'Generate a fresh, engaging software engineering question combining computer science fundamentals, concurrency or system internals, and practical engineering trade-offs.';
  }

  const prompt =
    `You are a top-tier technical interviewer conducting a live voice mock interview for a ${role}${company} position.\n` +
    `Mode: "${modeConfig.title}". Difficulty: "${difficulty}". Candidate Name: "${name}".\n` +
    `${modeDirective}${resumeText}${jdText}\n\n` +
    'CONVERSATIONAL VOICE RULES:\n' +
    '1. Start with a warm, brief 1-sentence greeting to the candidate.\n' +
    '2. Present the technical question or scenario clearly in 2 natural sentences.\n' +
    '3. Total response MUST be 2 to 3 spoken conversational sentences maximum (suitable for text-to-speech).\n' +
    '4. Do NOT use bullet points, markdown symbols, or long lectures.\n' +
    '5. Return ONLY the spoken dialogue.';

  // 1. Try Groq (fastest, ~1s) with temperature 0.85 for high diversity
  if (process.env.GROQ_API_KEY) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.GROQ_LLM_MODEL || 'qwen/qwen3.8-27b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.85,
          max_tokens: 180,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return cleanSpokenText(content);
      }
    } catch (e) {
      console.warn('Groq initial question generation error:', e.message);
    }
  }

  // 2. Try Gemini fallback (gemini-3.6-flash) with temperature 0.85
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
            maxOutputTokens: 250,
            temperature: 0.85,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (content) return cleanSpokenText(content);
      }
    } catch (e) {
      console.warn('Gemini initial question generation error:', e.message);
    }
  }

  // 3. Diverse fallback pool (never repeats the same static question)
  return getRandomPoolQuestion(modeKey, name);
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
      max_tokens: 280,
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

  // Format history for Gemini with turn indices and speaker clarity
  const conversationSummary = messages
    .map((m, idx) => `[Turn ${Math.floor(idx / 2) + 1}] ${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
    .join('\n\n');

  const fullPrompt = `${systemPrompt}\n\n=== FULL CONVERSATION TRANSCRIPT SO FAR (FROM TURN 1) ===\n${conversationSummary}\n\nNow respond as the interviewer in 1-3 spoken conversational sentences:`;

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
 * Generates the next dynamic interviewer turn with persistent long-term memory
 */
export const generateNextInterviewTurn = async (session, transcript = [], candidateAnswer = '') => {
  const modeKey = session?.mode || 'general_sde';
  const modeConfig = MODE_DEFINITIONS[modeKey] || MODE_DEFINITIONS.general_sde;
  const role = session?.targetRole || 'Software Development Engineer';
  const company = session?.targetCompany ? ` at ${session.targetCompany}` : '';
  const resumeText = session?.resumeText ? `\n\nCANDIDATE RESUME PROFILE:\n${session.resumeText.slice(0, 3500)}` : '';
  const jdText = session?.jobDescription ? `\n\nTARGET JOB SPECIFICATION:\n${session.jobDescription.slice(0, 3500)}` : '';

  // Extract the original opening question / topic from the first AI turn or session record
  const openingTurn = transcript.find((t) => t.speaker === 'ai') || null;
  const initialProblem = session?.initialQuestion || openingTurn?.text || 'Introductory technical problem assessment';

  const systemPrompt = `You are a Principal Technical Interviewer conducting a live voice mock interview for a ${role}${company} position.
Active Interview Mode: "${modeConfig.title}".
${modeConfig.persona}${resumeText}${jdText}

ORIGINAL OPENING PROBLEM & TARGET TOPIC:
"${initialProblem}"

PERSISTENT CONTEXT & UNBROKEN MEMORY DIRECTIVES:
1. You have a COMPLETE, UNBROKEN MEMORY of this entire interview session from Turn 1 to now.
2. NEVER forget what problem or architecture you originally started talking about. Every follow-up question must logically build upon what the candidate has explained so far.
3. Track the candidate's journey across turns: acknowledge their latest explanation, note what they got right, point out any missed edge cases or trade-offs, and drill into the next layer (e.g. naive intuition -> optimal data structure -> edge cases -> scalability & failure modes -> Big-O time and space).
4. Do NOT jump to an unrelated scenario or restart the interview unless the current problem has been fully solved and analyzed.
5. CONVERSATIONAL VOICE FORMAT: Speak in 1 to 3 punchy, natural spoken sentences maximum (suitable for text-to-speech). Do not use bullet points or long monologues. Return ONLY spoken dialogue.`;

  // Build full message history (up to 40 turns — full conversation window)
  const conversationTurns = transcript.slice(-40);
  const messages = [];

  for (const turn of conversationTurns) {
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
