import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Sparkles,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio,
  HandMetal,
  ChevronRight,
  ChevronLeft,
  BrainCircuit,
  Shuffle,
  Users,
} from 'lucide-react';
import { useInterviewStore } from '../store/interviewStore';
import { useAuthStore } from '../store/authStore';
import AudioWaveform from '../components/interview/AudioWaveform';
import ConfirmModal from '../components/interview/ConfirmModal';
import RabbitAvatar from '../components/interview/RabbitAvatar';
import { INTERVIEW_PANELISTS, getPanelistById } from '../utils/interviewPanelists';
import { flushSpeechQueue, stopAllSpeech } from '../utils/speechUtils';
import toast from 'react-hot-toast';

const InterviewRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentSession,
    livekitToken,
    livekitUrl,
    transcript,
    fetchSession,
    appendTranscriptTurn,
    submitEvaluation,
    evaluateSession,
    getInitialQuestion,
    getNextTurn,
  } = useInterviewStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeSection, setActiveSection] = useState('intro');
  const [liveCaption, setLiveCaption] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [showEarlyEndModal, setShowEarlyEndModal] = useState(false);

  // Interviewer Persona / Setup Mode: 'alex' | 'bella' | 'multi_panel' | 'random'
  const [voiceMode, setVoiceMode] = useState(() => {
    return localStorage.getItem('trackasap_interview_persona') || 'alex';
  });
  const [currentPanelistIndex, setCurrentPanelistIndex] = useState(0);

  // Sync with session if configured from lobby
  useEffect(() => {
    if (currentSession?.interviewerPersona) {
      setVoiceMode(currentSession.interviewerPersona);
    }
  }, [currentSession?.interviewerPersona]);

  const activePanelist = useMemo(() => {
    if (voiceMode === 'multi_panel' || voiceMode === 'random') {
      return INTERVIEW_PANELISTS[currentPanelistIndex % INTERVIEW_PANELISTS.length];
    }
    return getPanelistById(voiceMode);
  }, [voiceMode, currentPanelistIndex]);

  const transcriptEndRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const isAISpeakingRef = useRef(false);
  const isMutedRef = useRef(false);
  const lastAITextRef = useRef('');
  const recentAIPromptsRef = useRef([]);
  const aiAudioBlockedUntilRef = useRef(0);
  const isSessionActiveRef = useRef(true);
  const initialTimeoutRef = useRef(null);
  const followupTimeoutRef = useRef(null);
  const candidateAccumulatorRef = useRef('');
  const silenceTimeoutRef = useRef(null);
  const SILENCE_DEBOUNCE_MS = 2800; // 2.8s: allows candidate to speak multi-sentence answers and pause without interruption

  // Speech synthesis audio reliability refs (solves Chrome audio dropping & garbage collection bug)
  const activeUtteranceRef = useRef(null);
  const speechHeartbeatRef = useRef(null);
  const speechDispatchTimeoutRef = useRef(null);
  const hasSpeechRetriedRef = useRef(false);

  // Unconditional unmount, route exit, and page hide lifecycle listener
  useEffect(() => {
    isSessionActiveRef.current = true;

    const handleExit = () => {
      isSessionActiveRef.current = false;
      flushSpeechQueue();
    };

    window.addEventListener('beforeunload', handleExit);
    window.addEventListener('pagehide', handleExit);
    window.addEventListener('popstate', handleExit);

    return () => {
      isSessionActiveRef.current = false;
      window.removeEventListener('beforeunload', handleExit);
      window.removeEventListener('pagehide', handleExit);
      window.removeEventListener('popstate', handleExit);

      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      candidateAccumulatorRef.current = '';
      if (initialTimeoutRef.current) clearTimeout(initialTimeoutRef.current);
      if (followupTimeoutRef.current) clearTimeout(followupTimeoutRef.current);

      if (speechHeartbeatRef.current) clearInterval(speechHeartbeatRef.current);
      if (speechDispatchTimeoutRef.current) clearTimeout(speechDispatchTimeoutRef.current);
      activeUtteranceRef.current = null;
      window._activeInterviewUtterance = null;

      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.onend = null;
          speechRecognitionRef.current.onerror = null;
          speechRecognitionRef.current.onresult = null;
          speechRecognitionRef.current.onstart = null;
          speechRecognitionRef.current.stop();
          speechRecognitionRef.current.abort();
        } catch (e) {}
        speechRecognitionRef.current = null;
      }

      flushSpeechQueue();
    };
  }, []);

  // Pre-load and cache browser voices
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // High-fidelity natural voice matching algorithm (actively filters out legacy robotic desktop voices)
  const getPreferredVoiceForPanelist = (panelist) => {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const enVoices = voices.filter((v) => v.lang.startsWith('en'));
    const pool = enVoices.length > 0 ? enVoices : voices;

    // Filter out robotic legacy desktop voices (e.g. Microsoft David Desktop, Microsoft Zira Desktop)
    const cleanNaturalPool = pool.filter((v) => {
      const name = v.name.toLowerCase();
      return (
        !name.includes('david') &&
        !name.includes('zira') &&
        !name.includes('hazel') &&
        !name.includes('desktop')
      );
    });

    const searchPool = cleanNaturalPool.length > 0 ? cleanNaturalPool : pool;

    // 1. Check specific preferences for this panelist in the clean natural pool
    if (panelist?.voicePreferences) {
      for (const pref of panelist.voicePreferences) {
        const found = searchPool.find((v) => v.name.toLowerCase().includes(pref));
        if (found) return found;
      }
    }

    const isFemale = panelist?.gender === 'female';
    if (isFemale) {
      // Prioritize natural female voices (Edge Online Neural, Apple Samantha/Victoria, Chrome)
      const femaleOnline = searchPool.find(
        (v) =>
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('jenny') ||
          v.name.toLowerCase().includes('aria') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('victoria') ||
          v.name.toLowerCase().includes('google us english')
      );
      if (femaleOnline) return femaleOnline;

      const anyFemale = searchPool.find((v) => v.name.toLowerCase().includes('female'));
      if (anyFemale) return anyFemale;
    } else {
      // Prioritize natural male voices (Edge Online Neural, Apple Alex, Chrome)
      const maleOnline = searchPool.find(
        (v) =>
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('ryan') ||
          v.name.toLowerCase().includes('guy') ||
          v.name.toLowerCase().includes('christopher') ||
          v.name.toLowerCase().includes('alex') ||
          v.name.toLowerCase().includes('google us english')
      );
      if (maleOnline) return maleOnline;

      const anyMale = searchPool.find((v) => v.name.toLowerCase().includes('male'));
      if (anyMale) return anyMale;
    }

    return searchPool[0] || pool[0];
  };

  // Multi-layer Echo detection: exact substring + word-level token overlap against recent AI prompts
  const isEchoOfAI = (userText, aiUtterances = []) => {
    if (!userText || !aiUtterances || aiUtterances.length === 0) return false;
    const cleanUser = userText.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    if (!cleanUser) return false;

    const userWords = cleanUser.split(/\s+/).filter((w) => w.length > 1);
    if (userWords.length === 0) return false;

    for (const aiText of aiUtterances) {
      if (!aiText) continue;
      const cleanAI = aiText.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      if (!cleanAI) continue;

      // Substring check: if userText is in AI prompt (e.g. "could you elaborate on that")
      if (cleanUser.length >= 6 && cleanAI.includes(cleanUser)) {
        return true;
      }

      // Token overlap match: handles repeated words ("could you could you elaborate")
      const aiWords = new Set(cleanAI.split(/\s+/).filter((w) => w.length > 1));
      let matchCount = 0;
      for (const w of userWords) {
        if (aiWords.has(w)) matchCount++;
      }

      // If 50% or more of candidate's captured words are words directly from the AI's question
      if (userWords.length >= 2 && matchCount / userWords.length >= 0.5) {
        return true;
      }
    }
    return false;
  };

  // Mode-tailored opening question helper (used as resilient fallback if backend takes long to respond)
  const getClientOpeningQuestion = (session, currentUser) => {
    const mode = session?.mode || 'general_sde';
    const name = currentUser?.name?.split(' ')?.[0] || 'there';
    const role = session?.targetRole || 'Software Development Engineer';
    const company = session?.targetCompany ? ` at ${session.targetCompany}` : '';

    const fallbackBank = {
      dsa_interview: [
        `Hello ${name}! Welcome to your Verbal DSA round for ${role}${company}. Let's start with an algorithmic problem: suppose you are given a string of characters and need to find the length of the longest contiguous substring without any repeating characters. What algorithmic approach and data structures come to mind first?`,
        `Hello ${name}! Welcome to your Verbal DSA round for ${role}${company}. Here is your first problem: you are given an array of intervals representing meeting schedules, and you need to merge all overlapping intervals into the minimum number of slots. How would you solve this, and what is your time complexity?`,
        `Hello ${name}! Welcome to your Verbal DSA interview for ${role}${company}. Let's jump into your first challenge: suppose you have an array representing elevation heights, and you need to compute how much rainwater can be trapped after raining. What intuition and pointer technique would you use?`,
        `Hello ${name}! Welcome to your Verbal DSA round for ${role}${company}. Imagine you are given a directed graph of course prerequisites and need to find an ordering in which all courses can be taken, or detect if a cycle exists. How would you approach this algorithmically?`,
        `Hello ${name}! Welcome to your Verbal DSA round for ${role}${company}. Consider an unsorted integer array where you need to find the Kth largest element in expected linear time without fully sorting the array. Which data structure or partitioning algorithm would you select?`,
        `Hello ${name}! Welcome to your Verbal DSA round for ${role}${company}. Suppose you are given an integer array that was originally sorted in ascending order but has been rotated at an unknown pivot. How would you search for a target value in logarithmic time?`,
      ],
      system_design: [
        `Hello ${name}! Welcome to your System Design round for ${role}${company}. Today let's architect a distributed URL Shortener service like TinyURL that handles 50,000 read requests per second. How would you start by defining functional requirements and estimating storage?`,
        `Hello ${name}! Welcome to your System Design round for ${role}${company}. Imagine you are tasked with designing a real-time collaborative document editing system like Google Docs where multiple users edit simultaneously. What data synchronization models or conflict resolution techniques would you consider?`,
        `Hello ${name}! Welcome to your System Design round for ${role}${company}. Let's design a high-throughput Distributed Rate Limiter that protects our API gateway across multiple global data centers. How would you manage rate limit counters and minimize latency?`,
        `Hello ${name}! Welcome to your System Design round for ${role}${company}. Imagine we are building a video streaming platform like YouTube. How would you design the video ingestion, transcoding pipeline, and CDN delivery strategy for low latency playback?`,
        `Hello ${name}! Welcome to your System Design round for ${role}${company}. Today let's architect a proximity service like Yelp or Uber that returns nearby drivers or restaurants within a 5-mile radius with sub-50ms latency. How would you index geospatial coordinates?`,
      ],
      backend_interview: [
        `Hello ${name}! Welcome to your Backend Engineering round for ${role}${company}. To kick off: when architecting a high-throughput backend API in Node.js or Go, how do you manage asynchronous I/O and prevent database connection exhaustion under burst traffic?`,
        `Hello ${name}! Welcome to your Backend Engineering round for ${role}${company}. In distributed payment systems, how do you guarantee idempotency on mutating financial transactions to ensure network timeouts never trigger duplicate charges?`,
        `Hello ${name}! Welcome to your Backend Engineering round for ${role}${company}. Suppose your production database CPU spikes to 100% due to slow queries. Walk me through how you would inspect query execution plans and optimize B-tree indexes.`,
        `Hello ${name}! Welcome to your Backend Engineering round for ${role}${company}. How do you implement a distributed cache invalidation strategy with Redis that prevents both cache stampedes and stale data under high write concurrency?`,
      ],
      resume_interview: [
        `Hello ${name}! Welcome to your Resume and Project Deep-Dive for ${role}${company}. Walk me through your most technically complex software project: what was the core architecture, what technical trade-offs did you make, and how did you measure performance?`,
        `Hello ${name}! Welcome to your Resume Deep-Dive for ${role}${company}. Looking across your technical background, what has been the most challenging production outage or latency bottleneck you personally diagnosed and resolved?`,
      ],
      jd_interview: [
        `Hello ${name}! Welcome to your technical interview for ${role}${company} calibrated to this job description. To start, how does your hands-on production experience directly align with the core technical architecture and responsibilities of this role?`,
        `Hello ${name}! Welcome to your interview for ${role}${company}. Based on the target engineering requirements for this position, what is your approach to designing resilient, maintainable services that scale with team and traffic growth?`,
      ],
      general_sde: [
        `Hello ${name}! Welcome to your General SDE interview for ${role}${company}. To start us off, could you give a brief 60-second summary of your technical background and highlight the most interesting engineering challenge you have tackled?`,
        `Hello ${name}! Welcome to your SDE round for ${role}${company}. In high-performance backend systems, how do you evaluate the architectural trade-offs between a modular monolith and microservices for a growing engineering team?`,
        `Hello ${name}! Welcome to your General SDE interview for ${role}${company}. Let's begin with a core systems question: how does the operating system event loop and thread scheduling differ between CPU-bound workloads and I/O-bound microservices?`,
      ],
    };

    const pool = fallbackBank[mode] || fallbackBank.general_sde;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  // Adaptive mode-specific fallback matrix for resilient follow-up questioning
  const getModeSpecificFallback = (mode, candidateAnswer = '', turnCount = 0) => {
    if (mode === 'dsa_interview') {
      const dsaFollowups = [
        "That's a solid initial intuition. How does your proposed logic handle extreme edge cases such as an empty input array, duplicate values, or negative numbers?",
        "Good approach. Could you walk me through the exact worst-case Big-O time and space complexity of that solution, and where the memory bottleneck lies?",
        "Makes sense. If we needed to optimize the space complexity to O(1) auxiliary space, what trade-offs or pointer techniques would you explore?",
        "Well reasoned. How would you adapt this algorithm if the input data were a continuous stream that cannot fit entirely into main memory?",
      ];
      return {
        aiResponse: dsaFollowups[turnCount % dsaFollowups.length],
        section: turnCount > 3 ? 'complexity_analysis' : 'problem_solving',
      };
    }

    if (mode === 'system_design') {
      const sysFollowups = [
        "That architectural choice makes sense for standard traffic. How would you partition or shard the data across nodes when daily writes exceed 100 million records?",
        "Using a distributed cache is vital here. What eviction strategy would you configure, and how would you prevent cache stampede when popular keys expire simultaneously?",
        "Good high-level breakdown. If this service suffered a sudden regional datacenter outage, how would your architecture guarantee high availability without risking data inconsistency?",
        "How would you monitor service health, and what metrics or distributed tracing signals would you rely on to detect latency degradations in real time?",
      ];
      return {
        aiResponse: sysFollowups[turnCount % sysFollowups.length],
        section: turnCount > 3 ? 'scaling_and_bottlenecks' : 'system_design',
      };
    }

    if (mode === 'backend_interview') {
      const backendFollowups = [
        "Good breakdown. How do B-tree indexes behave differently under heavy writes compared to LSM trees, and how do you monitor slow query execution plans?",
        "Right on the concurrency model. When CPU-intensive tasks block the main thread, how do you offload that work to keep the API responsive?",
        "Solid points. How do you implement rate limiting and idempotency on state-mutating endpoints to prevent race conditions or duplicate submissions?",
        "How would you handle database connection pooling and failover under a sudden 10x traffic surge?",
      ];
      return {
        aiResponse: backendFollowups[turnCount % backendFollowups.length],
        section: turnCount > 3 ? 'databases_and_caching' : 'technical',
      };
    }

    if (mode === 'resume_interview') {
      const resumeFollowups = [
        "Interesting. In that specific project, what was the biggest technical trade-off you made between development velocity and long-term architectural maintainability?",
        "Walk me through a critical production bug or performance bottleneck that occurred in that system, and how you tracked down the root cause.",
        "If you were to re-architect that solution today with everything you learned, what technology or design choice would you replace?",
      ];
      return {
        aiResponse: resumeFollowups[turnCount % resumeFollowups.length],
        section: 'project_deepdive',
      };
    }

    const generalFollowups = [
      "Good explanation. If you were building this from scratch today with 10x scale, what architectural component would you design differently?",
      "Could you elaborate on the operational trade-offs of that approach, particularly regarding observability, debugging, and maintenance?",
      "That makes sense. What would be your testing strategy—unit, integration, and load testing—to ensure this doesn't break in production?",
    ];
    return {
      aiResponse: generalFollowups[turnCount % generalFollowups.length],
      section: 'technical',
    };
  };

  // 1. Fetch Session on mount
  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    }
  }, [sessionId, fetchSession]);

  // 2. Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // 4. Client-side Speech Recognition & Synthesis for responsive voice loop
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsCandidateSpeaking(false);
      };

      recognition.onresult = (event) => {
        // Drop any microphone audio if AI is speaking or acoustic silence buffer is active
        if (
          isAISpeakingRef.current ||
          Date.now() < aiAudioBlockedUntilRef.current
        ) {
          return;
        }

        // Candidate actively speaking: cancel silence timer immediately so they are never interrupted
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const chunk = result[0]?.transcript || '';

          // Drop interim chunks that match recent AI prompts
          if (isEchoOfAI(chunk, recentAIPromptsRef.current)) {
            continue;
          }

          if (result.isFinal) {
            const trimmed = chunk.trim();
            if (trimmed) {
              candidateAccumulatorRef.current = candidateAccumulatorRef.current
                ? `${candidateAccumulatorRef.current} ${trimmed}`
                : trimmed;
            }
          } else {
            interimText += chunk;
          }
        }

        const currentCombined = [candidateAccumulatorRef.current, interimText]
          .filter(Boolean)
          .join(' ')
          .trim();

        if (currentCombined) {
          setIsCandidateSpeaking(true);
          setLiveCaption(currentCombined);

          // Reset silence debounce timer: only auto-submit after 2.8s of silence
          silenceTimeoutRef.current = setTimeout(() => {
            commitCandidateAnswer();
          }, SILENCE_DEBOUNCE_MS);
        }
      };

      recognition.onend = () => {
        // Automatically restart speech recognition only when AI is definitely not speaking and not in acoustic silence window
        if (
          !isAISpeakingRef.current &&
          Date.now() >= aiAudioBlockedUntilRef.current &&
          !isMutedRef.current
        ) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognition.onerror = (e) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('Speech recognition status:', e.error);
        }
        setIsCandidateSpeaking(false);
      };

      speechRecognitionRef.current = recognition;
    }

    // Dynamic Mode-Tailored AI Initial Greeting
    if (initialTimeoutRef.current) clearTimeout(initialTimeoutRef.current);
    initialTimeoutRef.current = setTimeout(async () => {
      if (!isSessionActiveRef.current) return;
      if (transcript.length === 0 && currentSession) {
        setIsAIThinking(true);
        let openingQuestion = '';

        try {
          const res = await getInitialQuestion(sessionId);
          if (!isSessionActiveRef.current) {
            setIsAIThinking(false);
            return;
          }
          if (res?.success && res.initialQuestion) {
            openingQuestion = res.initialQuestion;
          }
        } catch (e) {
          console.warn('Backend opening question failed, using local fallback:', e);
        }

        if (!isSessionActiveRef.current) {
          setIsAIThinking(false);
          return;
        }

        if (!openingQuestion) {
          openingQuestion = getClientOpeningQuestion(currentSession, user);
        }

        setIsAIThinking(false);
        speakAIResponse(openingQuestion);
      }
    }, 800);

    return () => {
      if (initialTimeoutRef.current) clearTimeout(initialTimeoutRef.current);
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.onend = null;
          speechRecognitionRef.current.abort();
        } catch (e) {}
      }
      flushSpeechQueue();
    };
  }, [currentSession]);

  // Voice Synthesis helper with multi-panel interviewer support and Chrome audio deadlock protection
  const speakAIResponse = (text) => {
    if (!text || !isSessionActiveRef.current) {
      flushSpeechQueue();
      return;
    }
    lastAITextRef.current = text.toLowerCase();
    recentAIPromptsRef.current = [text, ...(recentAIPromptsRef.current || []).slice(0, 4)];

    // Resolve active panelist for this turn (rotates across board members in multi-panel mode)
    let turnPanelist = activePanelist;
    if (voiceMode === 'multi_panel') {
      turnPanelist = INTERVIEW_PANELISTS[currentPanelistIndex % INTERVIEW_PANELISTS.length];
      setCurrentPanelistIndex((prev) => prev + 1);
    }

    appendTranscriptTurn(
      'ai',
      text,
      activeSection,
      turnPanelist.name,
      turnPanelist.badge,
      turnPanelist.color
    );

    // Mute mic & clear captions immediately before any sound comes out of speakers
    isAISpeakingRef.current = true;
    aiAudioBlockedUntilRef.current = Number.MAX_SAFE_INTEGER;
    setIsAISpeaking(true);
    setIsCandidateSpeaking(false);
    setLiveCaption('');

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.abort();
      } catch (e) {}
    }

    if (window.speechSynthesis) {
      // 1. Cancel previous speech and ensure engine is unpaused
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // 2. Clear any pending speech timeouts or heartbeats
      if (speechDispatchTimeoutRef.current) {
        clearTimeout(speechDispatchTimeoutRef.current);
        speechDispatchTimeoutRef.current = null;
      }
      if (speechHeartbeatRef.current) {
        clearInterval(speechHeartbeatRef.current);
        speechHeartbeatRef.current = null;
      }

      // 3. Create utterance and attach globally to prevent Chromium V8 Garbage Collection bug
      const utterance = new SpeechSynthesisUtterance(text);
      activeUtteranceRef.current = utterance;
      window._activeInterviewUtterance = utterance;

      const chosenVoice = getPreferredVoiceForPanelist(turnPanelist);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }
      utterance.pitch = turnPanelist.pitch || 1.0;
      utterance.rate = turnPanelist.rate || 1.02;

      utterance.onstart = () => {
        if (!isSessionActiveRef.current) {
          stopAllSpeech();
          return;
        }
        isAISpeakingRef.current = true;
        aiAudioBlockedUntilRef.current = Number.MAX_SAFE_INTEGER;
        setIsAISpeaking(true);
        setIsCandidateSpeaking(false);
        setLiveCaption('');
      };

      utterance.onend = () => {
        if (speechHeartbeatRef.current) {
          clearInterval(speechHeartbeatRef.current);
          speechHeartbeatRef.current = null;
        }
        activeUtteranceRef.current = null;
        window._activeInterviewUtterance = null;
        setIsAISpeaking(false);

        if (!isSessionActiveRef.current) {
          isAISpeakingRef.current = false;
          return;
        }

        // Generous acoustic silence buffer: 1400ms after audio finishes before microphone opens
        aiAudioBlockedUntilRef.current = Date.now() + 1400;
        setTimeout(() => {
          if (!isSessionActiveRef.current) return;
          isAISpeakingRef.current = false;
          if (!isMutedRef.current && speechRecognitionRef.current) {
            try {
              speechRecognitionRef.current.start();
            } catch (e) {}
          }
        }, 1400);
      };

      utterance.onerror = (event) => {
        console.warn('Speech synthesis event:', event.error);
        if (speechHeartbeatRef.current) {
          clearInterval(speechHeartbeatRef.current);
          speechHeartbeatRef.current = null;
        }
        activeUtteranceRef.current = null;
        window._activeInterviewUtterance = null;
        setIsAISpeaking(false);

        // If audio failed unexpectedly (network or voice busy), retry once with default system voice
        if (
          !hasSpeechRetriedRef.current &&
          isSessionActiveRef.current &&
          event.error !== 'canceled' &&
          event.error !== 'interrupted'
        ) {
          hasSpeechRetriedRef.current = true;
          const fallbackUtterance = new SpeechSynthesisUtterance(text);
          fallbackUtterance.rate = 1.0;
          activeUtteranceRef.current = fallbackUtterance;
          window._activeInterviewUtterance = fallbackUtterance;
          fallbackUtterance.onend = () => {
            activeUtteranceRef.current = null;
            window._activeInterviewUtterance = null;
            setIsAISpeaking(false);
            isAISpeakingRef.current = false;
          };
          window.speechSynthesis.speak(fallbackUtterance);
          return;
        }

        if (!isSessionActiveRef.current) {
          isAISpeakingRef.current = false;
          return;
        }

        aiAudioBlockedUntilRef.current = Date.now() + 800;
        setTimeout(() => {
          if (!isSessionActiveRef.current) return;
          isAISpeakingRef.current = false;
          if (!isMutedRef.current && speechRecognitionRef.current) {
            try {
              speechRecognitionRef.current.start();
            } catch (e) {}
          }
        }, 800);
      };

      // 4. Stagger by 60ms to let Chromium OS audio thread cleanly process cancel() before queueing new speech
      speechDispatchTimeoutRef.current = setTimeout(() => {
        if (!isSessionActiveRef.current) return;
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        // Heartbeat to prevent Chrome 15s freeze
        speechHeartbeatRef.current = setInterval(() => {
          if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        }, 2000);

        window.speechSynthesis.speak(utterance);
      }, 60);
    }
  };

  const handleBargeIn = () => {
    stopAllSpeech();
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    candidateAccumulatorRef.current = '';
    setIsAISpeaking(false);
    isAISpeakingRef.current = false;
    aiAudioBlockedUntilRef.current = Date.now() + 300;
    setLiveCaption('');

    setTimeout(() => {
      if (isSessionActiveRef.current && !isMutedRef.current && speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.start();
        } catch (e) {}
      }
    }, 300);

    toast('Interrupted AI — listening to you now!', {
      icon: '⚡',
      style: { background: '#18181b', color: '#39ff14', border: '1px solid #39ff14' },
      duration: 1500,
    });
  };

  // Finalizes the candidate's turn and sends the full multi-sentence explanation to AI
  const commitCandidateAnswer = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    const fullAnswer = candidateAccumulatorRef.current.trim();
    candidateAccumulatorRef.current = '';
    setIsCandidateSpeaking(false);
    setLiveCaption('');

    if (!fullAnswer || fullAnswer.length < 2) return;

    // Filter out acoustic echo on very short utterances (long answers are never pure echoes)
    if (fullAnswer.split(/\s+/).length < 8 && isEchoOfAI(fullAnswer, recentAIPromptsRef.current)) {
      console.warn('Blocked acoustic echo candidate turn:', fullAnswer);
      return;
    }

    handleCandidateUtterance(fullAnswer);
  };

  const handleDoneSpeakingEarly = () => {
    commitCandidateAnswer();
  };

  // Allow pressing Enter key to quickly submit spoken answer without waiting for silence timer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && isCandidateSpeaking && !['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) {
        e.preventDefault();
        handleDoneSpeakingEarly();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCandidateSpeaking]);

  const handleCandidateUtterance = async (text) => {
    if (!text || !isSessionActiveRef.current || isAISpeakingRef.current || Date.now() < aiAudioBlockedUntilRef.current) return;

    if (isEchoOfAI(text, recentAIPromptsRef.current)) {
      console.warn('Blocked acoustic echo utterance:', text);
      return;
    }

    appendTranscriptTurn('user', text, activeSection);
    setIsCandidateSpeaking(false);
    setLiveCaption('');

    // Trigger dynamic conversational follow-up turn
    if (followupTimeoutRef.current) clearTimeout(followupTimeoutRef.current);
    followupTimeoutRef.current = setTimeout(() => {
      if (isSessionActiveRef.current) {
        generateAdaptiveFollowup(text);
      }
    }, 400);
  };

  const generateAdaptiveFollowup = async (candidateAnswer) => {
    if (!isSessionActiveRef.current) return;
    setIsAIThinking(true);

    try {
      // 1. Call dynamic backend conversational agent (Groq qwen3.8-27b / Gemini 3.6 Flash)
      const res = await getNextTurn(sessionId, candidateAnswer);
      if (!isSessionActiveRef.current) {
        setIsAIThinking(false);
        return;
      }
      if (res?.success && res.aiResponse) {
        if (res.section) setActiveSection(res.section);
        setIsAIThinking(false);
        speakAIResponse(res.aiResponse);
        return;
      }
    } catch (err) {
      console.warn('Dynamic conversational agent call failed, using mode-specific fallback:', err);
    }

    if (!isSessionActiveRef.current) {
      setIsAIThinking(false);
      return;
    }

    setIsAIThinking(false);

    // 2. Intelligent mode-specific fallback matrix
    const mode = currentSession?.mode || 'general_sde';
    const fallback = getModeSpecificFallback(mode, candidateAnswer, transcript.length);
    if (fallback.section) setActiveSection(fallback.section);
    speakAIResponse(fallback.aiResponse);
  };

  const toggleMuteMic = () => {
    if (isMuted) {
      isMutedRef.current = false;
      setIsMuted(false);
      if (!isAISpeakingRef.current && speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.start();
        } catch (e) {}
      }
      toast.success('Microphone unmuted');
    } else {
      isMutedRef.current = true;
      setIsMuted(true);
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort();
        } catch (e) {}
      }
      toast('Microphone muted', { icon: '🔇' });
    }
  };

  const handleEndInterview = () => {
    if (transcript.length < 3) {
      setShowEarlyEndModal(true);
      return;
    }
    executeEndInterview();
  };

  const executeEndInterview = async () => {
    // 1. Instantly mark session as inactive so no background promise/timeout can trigger speech or recognition
    isSessionActiveRef.current = false;
    setShowEarlyEndModal(false);
    setIsEnding(true);

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    candidateAccumulatorRef.current = '';

    if (initialTimeoutRef.current) clearTimeout(initialTimeoutRef.current);
    if (followupTimeoutRef.current) clearTimeout(followupTimeoutRef.current);

    // 2. Thoroughly flush all audio and pending browser utterances
    flushSpeechQueue();

    // 3. Dismantle speech recognition engine
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onstart = null;
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current.abort();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }

    try {
      toast.loading('AI is auditing transcript & generating evaluation report...', { id: 'eval-loading' });
      const res = await evaluateSession(sessionId, transcript);
      toast.dismiss('eval-loading');

      if (res && res.success) {
        toast.success('Interview evaluation complete!');
      } else {
        toast('Evaluation generated', { icon: '📊' });
      }
      flushSpeechQueue();
      navigate(`/interview/results/${sessionId}`);
    } catch (err) {
      toast.dismiss('eval-loading');
      console.error('Failed to generate evaluation report:', err);
      toast.error('Could not complete evaluation analysis');
      flushSpeechQueue();
      navigate(`/interview/results/${sessionId}`);
    } finally {
      setIsEnding(false);
      flushSpeechQueue();
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-dark-950 text-dark-100 flex flex-col justify-between overflow-hidden relative selection:bg-neon-green/30">
      {/* Top Header Bar */}
      <header className="h-16 px-6 border-b border-white/10 bg-dark-900/60 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-green animate-ping" />
          <span className="font-bold text-white text-sm sm:text-base">
            Live Technical Interview
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-dark-300 font-medium capitalize">
            {currentSession?.mode?.replace('_', ' ') || 'General SDE'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-neon-green/10 text-neon-green font-mono uppercase font-semibold">
            {activeSection}
          </span>
        </div>

        {/* Controls: Multi-Panel Technical Board, Timer & Finish Button */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Multi-Panel Technical Board & Voice Selector */}
          <div className="flex items-center gap-1.5 bg-dark-950/80 border border-white/10 px-2.5 py-1.5 rounded-lg text-xs">
            <Users className="w-3.5 h-3.5 text-neon-green shrink-0" />
            <select
              value={voiceMode}
              onChange={(e) => {
                const val = e.target.value;
                setVoiceMode(val);
                if (val === 'multi_panel') {
                  toast.success('🤼 Multi-Panel Board active! Interviewers rotate dynamically across turns.');
                } else if (val === 'random') {
                  const nextIdx = Math.floor(Math.random() * INTERVIEW_PANELISTS.length);
                  setCurrentPanelistIndex(nextIdx);
                  const p = INTERVIEW_PANELISTS[nextIdx];
                  toast.success(`🎲 Assigned to ${p.name} (${p.shortName})`);
                } else {
                  const p = getPanelistById(val);
                  toast.success(`Interviewer locked to ${p.name} (${p.badge})`);
                }
              }}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="alex" className="bg-dark-900 text-white">
                ⚡ Alex Rivera · Systems Architect (Natural Male)
              </option>
              <option value="bella" className="bg-dark-900 text-white">
                🧠 Dr. Bella Chen · Algorithms Lead (Natural Female)
              </option>
              <option value="multi_panel" className="bg-dark-900 text-white">
                🤼 Multi-Panel Board (Alex & Dr. Bella)
              </option>
              <option value="random" className="bg-dark-900 text-white">
                🎲 Random ({activePanelist?.shortName})
              </option>
            </select>
            {(voiceMode === 'random' || voiceMode === 'multi_panel') && (
              <button
                type="button"
                onClick={() => {
                  setCurrentPanelistIndex((prev) => (prev + 1) % INTERVIEW_PANELISTS.length);
                  const next = INTERVIEW_PANELISTS[(currentPanelistIndex + 1) % INTERVIEW_PANELISTS.length];
                  toast.success(`Switched active panelist to ${next.name} (${next.badge})`);
                }}
                title="Shuffle / Next Panelist"
                className="text-dark-400 hover:text-neon-green transition-colors p-0.5 ml-0.5"
              >
                <Shuffle className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono text-sm text-dark-300 bg-dark-950/80 px-3 py-1.5 rounded-lg border border-white/10">
            <Clock className="w-4 h-4 text-neon-green" />
            {formatTime(elapsedSeconds)}
          </div>

          <button
            type="button"
            disabled={isEnding}
            onClick={handleEndInterview}
            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-bold py-2 px-3.5 rounded-xl transition-all"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            End & Evaluate
          </button>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 sm:p-8 gap-8 max-w-7xl mx-auto w-full relative z-10">
        {/* Center: Stage Visualizer & Voice Orb */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 w-full max-w-xl">
          {/* TrackAsap Rabbit AI Avatar (Dynamic Multi-Panel Interviewer Persona) */}
          <RabbitAvatar
            isAISpeaking={isAISpeaking}
            isCandidateSpeaking={isCandidateSpeaking}
            panelist={activePanelist}
          />

          {/* Dynamic Waveform Visualizer */}
          <div className="w-full max-w-md bg-dark-900/50 border border-white/10 rounded-2xl p-3 backdrop-blur-sm">
            <AudioWaveform
              isActive={isAISpeaking || isCandidateSpeaking}
              color={isAISpeaking ? '#39ff14' : isCandidateSpeaking ? '#60a5fa' : '#71717a'}
              barCount={28}
            />
          </div>

          {/* Status Indicator */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-dark-900 border border-white/10 text-xs font-medium">
              {isAIThinking ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-400 font-semibold">AI is analyzing & formulating question...</span>
                </>
              ) : isAISpeaking ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-neon-green animate-ping" />
                  <span className="text-neon-green font-semibold">AI is speaking...</span>
                  <span className="text-dark-400 text-[11px]">(Click Interrupt or speak to barge-in)</span>
                </>
              ) : isCandidateSpeaking ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  <span className="text-blue-400 font-semibold">Listening to your explanation...</span>
                  <span className="text-dark-400 text-[11px] hidden sm:inline">(Speak freely — pause when done or click "Done Speaking")</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-dark-500" />
                  <span className="text-dark-300">Your turn to answer — speak whenever you're ready</span>
                </>
              )}
            </div>

            {liveCaption && (
              <div className="max-w-lg mx-auto px-4 py-3 bg-dark-900/90 border border-blue-500/30 rounded-2xl backdrop-blur-md shadow-lg transition-all animate-fade-in text-left">
                <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-white/5 pb-1">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    Transcribing your answer
                  </span>
                  <button
                    type="button"
                    onClick={handleDoneSpeakingEarly}
                    className="text-[11px] font-bold text-neon-green hover:text-neon-green/80 flex items-center gap-1 cursor-pointer bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/30 px-2.5 py-0.5 rounded-lg transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-neon-green" />
                    Done Speaking ↵
                  </button>
                </div>
                <p className="text-xs text-blue-100 leading-relaxed max-h-24 overflow-y-auto pr-1 scrollbar-thin">
                  "{liveCaption}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Real-Time Live Transcript */}
        <div
          className={`w-full md:w-96 bg-dark-900/70 border border-white/10 rounded-2xl flex flex-col h-[480px] backdrop-blur-md overflow-hidden transition-all ${
            showTranscript ? 'block' : 'hidden md:flex opacity-30 pointer-events-none'
          }`}
        >
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5 text-neon-green" />
              Live Transcript
            </span>
            <span className="text-[11px] text-dark-400 font-mono">{transcript.length} turns</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
            {transcript.map((turn, i) => {
              const isAI = turn.speaker === 'ai';
              return (
                <div
                  key={i}
                  className={`flex flex-col ${isAI ? 'items-start' : 'items-end'} space-y-1`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-dark-400 px-1 flex items-center gap-1.5">
                    {isAI ? (
                      <>
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: turn.panelistColor || '#39ff14' }}
                        />
                        <span style={{ color: turn.panelistColor || '#39ff14' }} className="font-bold">
                          {turn.speakerName || 'AI Interviewer'}
                        </span>
                        {turn.speakerRole && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-dark-300 font-mono font-medium">
                            {turn.speakerRole}
                          </span>
                        )}
                      </>
                    ) : (
                      'You'
                    )}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      isAI
                        ? 'bg-dark-950 text-dark-100 rounded-tl-sm'
                        : 'bg-neon-green/10 border border-neon-green/30 text-white rounded-tr-sm'
                    }`}
                    style={
                      isAI
                        ? {
                            borderColor: turn.panelistColor
                              ? `${turn.panelistColor}40`
                              : 'rgba(57, 255, 20, 0.2)',
                            borderWidth: 1,
                          }
                        : undefined
                    }
                  >
                    {turn.text}
                  </div>
                </div>
              );
            })}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      </div>

      {/* Bottom Control Dock */}
      <div className="h-20 border-t border-white/10 bg-dark-900/80 backdrop-blur-lg px-6 flex items-center justify-center gap-4 z-20">
        {/* Mute Button */}
        <button
          type="button"
          onClick={toggleMuteMic}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
            isMuted
              ? 'bg-red-500/20 border-red-500/40 text-red-400'
              : 'bg-dark-950 border-white/10 text-white hover:border-white/30'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-neon-green" />}
        </button>

        {/* Barge-in Button */}
        <button
          type="button"
          onClick={handleBargeIn}
          disabled={!isAISpeaking}
          className="flex items-center gap-2 bg-dark-950 hover:bg-dark-800 disabled:opacity-40 border border-white/10 hover:border-neon-green/40 px-5 py-3 rounded-2xl text-xs font-bold text-white transition-all transform active:scale-95"
        >
          <HandMetal className="w-4 h-4 text-neon-green" />
          Interrupt (Barge-in)
        </button>

        {/* Done Speaking / Submit Answer Button */}
        {isCandidateSpeaking && (
          <button
            type="button"
            onClick={handleDoneSpeakingEarly}
            className="flex items-center gap-2 bg-neon-green/20 hover:bg-neon-green/30 border border-neon-green/60 text-neon-green px-5 py-3 rounded-2xl text-xs font-bold transition-all transform active:scale-95 animate-pulse shadow-[0_0_20px_rgba(57,255,20,0.25)]"
            title="Press Enter or click to submit your answer immediately without waiting for silence timer"
          >
            <CheckCircle2 className="w-4 h-4 text-neon-green" />
            Done Speaking ↵
          </button>
        )}

        {/* Toggle Transcript View on Mobile */}
        <button
          type="button"
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-12 h-12 rounded-2xl flex items-center justify-center bg-dark-950 border border-white/10 text-white hover:border-white/30 transition-all md:hidden"
        >
          <MessageSquare className="w-5 h-5 text-dark-300" />
        </button>
      </div>

      {/* Loading Overlay during AI evaluation */}
      {isEnding && (
        <div className="fixed inset-0 z-50 bg-dark-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
            <BrainCircuit className="w-7 h-7 text-neon-green absolute inset-0 m-auto animate-pulse" />
          </div>
          <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">
            AI Bar Raiser Evaluating Interview
          </h3>
          <p className="text-xs sm:text-sm text-dark-300 max-w-md leading-relaxed">
            Auditing interview transcript, analyzing engineering depth, and computing objective speech delivery metrics...
          </p>
        </div>
      )}

      {/* Custom Confirmation Modal for Ending Early */}
      <ConfirmModal
        isOpen={showEarlyEndModal}
        onClose={() => setShowEarlyEndModal(false)}
        onConfirm={executeEndInterview}
        title="End Interview Early?"
        description="You have only completed a couple of questions. Ending now will generate your performance report based on your answers so far."
        confirmText="End & Generate Report"
        variant="warning"
        icon={AlertTriangle}
        isLoading={isEnding}
      />
    </div>
  );
};

export default InterviewRoom;
