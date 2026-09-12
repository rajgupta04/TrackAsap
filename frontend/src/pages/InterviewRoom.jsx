import { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { useInterviewStore } from '../store/interviewStore';
import { useAuthStore } from '../store/authStore';
import AudioWaveform from '../components/interview/AudioWaveform';
import ConfirmModal from '../components/interview/ConfirmModal';
import RabbitAvatar from '../components/interview/RabbitAvatar';
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
  const [voiceGender, setVoiceGender] = useState('male'); // 'male' (Alex/Adam) | 'female' (Bella/Jenny)

  const transcriptEndRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const isAISpeakingRef = useRef(false);
  const isMutedRef = useRef(false);
  const lastAITextRef = useRef('');
  const recentAIPromptsRef = useRef([]);
  const aiAudioBlockedUntilRef = useRef(0);

  // Pre-load and cache browser voices
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Natural voice matching algorithm
  const getPreferredVoice = (gender = 'male') => {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    if (gender === 'male') {
      const malePreferences = [
        'alex',
        'ryan online (natural)',
        'guy online (natural)',
        'christopher online (natural)',
        'natural',
        'google us english',
        'daniel',
        'george',
        'mark',
        'david',
      ];

      for (const pref of malePreferences) {
        const found = voices.find(
          (v) => v.name.toLowerCase().includes(pref) && v.lang.startsWith('en')
        );
        if (found) return found;
      }

      // Any male English voice fallback
      const anyMale = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.toLowerCase().includes('male') ||
            (!v.name.toLowerCase().includes('female') &&
              !v.name.toLowerCase().includes('zira') &&
              !v.name.toLowerCase().includes('susan')))
      );
      if (anyMale) return anyMale;
    } else {
      const femalePreferences = ['jenny', 'aria', 'samantha', 'victoria', 'zira', 'female'];
      for (const pref of femalePreferences) {
        const found = voices.find(
          (v) => v.name.toLowerCase().includes(pref) && v.lang.startsWith('en')
        );
        if (found) return found;
      }
    }

    return voices.find((v) => v.lang.startsWith('en')) || voices[0];
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

  // Mode-tailored opening question helper (used as instant fallback if backend call times out)
  const getClientOpeningQuestion = (session, currentUser) => {
    const mode = session?.mode || 'general_sde';
    const name = currentUser?.name?.split(' ')?.[0] || 'there';
    const role = session?.targetRole || 'Software Development Engineer';
    const company = session?.targetCompany ? ` at ${session.targetCompany}` : '';

    switch (mode) {
      case 'dsa_interview':
        return `Hello ${name}! Welcome to your Verbal DSA and Problem Solving round for ${role}${company}. Today we will explore algorithmic intuition, data structure selection, and Big-O complexity out loud without writing code. Let's dive right into your first problem: suppose you are given an integer array and need to find the contiguous subarray with the largest sum in linear time. What algorithmic approach comes to mind first, and how would you explain your intuition?`;
      case 'system_design':
        return `Hello ${name}! Welcome to your System Design and Scalability round for ${role}${company}. Today we will architect a high-scale distributed system from scratch. Imagine you are tasked with designing a real-time Notification Service or a distributed Rate Limiter that must support 100,000 requests per second with high availability. How would you begin by defining the functional and non-functional requirements?`;
      case 'backend_interview':
        return `Hello ${name}! Welcome to the Backend Engineering technical round for ${role}${company}. We'll focus on server runtimes, database indexing, caching layers, and API resilience. To kick off: when architecting a high-throughput backend API in Node.js or Go, how do you manage asynchronous I/O and prevent database connection exhaustion under burst traffic?`;
      case 'resume_interview':
        return `Hello ${name}! Welcome to your Resume and Project Deep-Dive for ${role}${company}. Let's jump straight into your flagship engineering project: walk me through the high-level architecture, your individual contribution, and the most complex technical hurdle you had to solve.`;
      case 'jd_interview':
        return `Hello ${name}! Welcome to your technical round for ${role}${company} calibrated to the job description. To start off, could you highlight how your hands-on production experience directly aligns with the core technical requirements of this role?`;
      default:
        return `Hello ${name}! Welcome to your General SDE mock interview for ${role}${company}. We will cover computer science core concepts, algorithmic problem solving, and engineering trade-offs. To get started, could you give a brief 60-second introduction of your technical background and your favorite engineering challenge to date?`;
    }
  };

  // Mode-specific fallback matrix for resilient follow-up questioning
  const getModeSpecificFallback = (mode, candidateAnswer = '', turnCount = 0) => {
    const lower = candidateAnswer.toLowerCase();

    if (mode === 'dsa_interview') {
      if (lower.includes('kadane') || lower.includes('array') || lower.includes('subarray')) {
        return {
          aiResponse:
            "That makes sense with Kadane's algorithm. How does your logic handle an array where every single element is negative, and what is your exact Big-O time and space complexity?",
          section: 'problem_solving',
        };
      }
      if (lower.includes('negative') || lower.includes('hash') || lower.includes('map') || lower.includes('index')) {
        return {
          aiResponse:
            'Good catch on handling negative elements. Now, if we need to return the starting and ending indices of the maximum subarray rather than just the sum, how would you adjust your pointer tracking?',
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
          'Understood. Could you walk me through an edge case with duplicate elements or an empty input array, and confirm your Big-O time complexity?',
        section: 'problem_solving',
      };
    }

    if (mode === 'system_design') {
      if (lower.includes('database') || lower.includes('sql') || lower.includes('nosql')) {
        return {
          aiResponse:
            'That architectural choice makes sense for standard traffic. How would you partition or shard the data across database nodes when daily writes exceed 100 million records?',
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
          'Good high-level breakdown. If this service suffered a sudden regional datacenter outage, how would your architecture guarantee high availability without risking data inconsistency?',
        section: 'system_design',
      };
    }

    if (mode === 'backend_interview') {
      if (lower.includes('mongo') || lower.includes('postgres') || lower.includes('index')) {
        return {
          aiResponse:
            'Indexes are crucial there. How do B-tree indexes behave differently under heavy writes compared to LSM trees, and how do you monitor slow query execution plans in production?',
          section: 'databases_and_caching',
        };
      }
      if (lower.includes('async') || lower.includes('event') || lower.includes('thread') || lower.includes('loop')) {
        return {
          aiResponse:
            'Right on the event loop mechanics. When CPU-intensive tasks block the main thread, how do you offload that work to worker threads or background workers to keep the API responsive?',
          section: 'technical',
        };
      }
      return {
        aiResponse:
          'Solid points. How do you implement rate limiting and idempotency on financial or state-mutating endpoints to prevent duplicate operations during network retries?',
        section: 'technical',
      };
    }

    if (mode === 'resume_interview') {
      return {
        aiResponse:
          'In that project, what was the biggest technical trade-off you made between development velocity and long-term architectural maintainability?',
        section: 'project_deepdive',
      };
    }

    if (mode === 'jd_interview') {
      return {
        aiResponse:
          'That experience is directly relevant to this job description. If you encountered a critical production outage in that subsystem during your first week, what would be your step-by-step diagnostic process?',
        section: 'technical',
      };
    }

    return {
      aiResponse:
        'Good explanation. If you were building this from scratch today with 10x scale, what architectural component would you design differently?',
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

        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;

        // Check if interim words match recent AI prompts
        if (isEchoOfAI(transcriptText, recentAIPromptsRef.current)) {
          return;
        }

        if (event.results[current].isFinal) {
          setIsCandidateSpeaking(false);
          setLiveCaption('');
          const trimmed = transcriptText.trim();
          
          // Ensure it's not an echo of the AI's question
          if (trimmed && !isEchoOfAI(trimmed, recentAIPromptsRef.current)) {
            handleCandidateUtterance(trimmed);
          }
        } else {
          setIsCandidateSpeaking(true);
          setLiveCaption(transcriptText);
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
    const initialTimeout = setTimeout(async () => {
      if (transcript.length === 0 && currentSession) {
        setIsAIThinking(true);
        let openingQuestion = '';

        try {
          const res = await getInitialQuestion(sessionId);
          if (res?.success && res.initialQuestion) {
            openingQuestion = res.initialQuestion;
          }
        } catch (e) {
          console.warn('Backend opening question failed, using local fallback:', e);
        }

        if (!openingQuestion) {
          openingQuestion = getClientOpeningQuestion(currentSession, user);
        }

        setIsAIThinking(false);
        speakAIResponse(openingQuestion);
      }
    }, 800);

    return () => {
      clearTimeout(initialTimeout);
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort();
        } catch (e) {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentSession]);

  // Voice Synthesis helper with barge-in support and acoustic echo guard
  const speakAIResponse = (text) => {
    if (!text) return;
    lastAITextRef.current = text.toLowerCase();
    recentAIPromptsRef.current = [text, ...(recentAIPromptsRef.current || []).slice(0, 4)];
    appendTranscriptTurn('ai', text, activeSection);

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
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const chosenVoice = getPreferredVoice(voiceGender);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }
      // Calm, confident natural cadence:
      utterance.pitch = voiceGender === 'male' ? 0.94 : 1.0;
      utterance.rate = 1.02;

      utterance.onstart = () => {
        isAISpeakingRef.current = true;
        aiAudioBlockedUntilRef.current = Number.MAX_SAFE_INTEGER;
        setIsAISpeaking(true);
        setIsCandidateSpeaking(false);
        setLiveCaption('');
      };

      utterance.onend = () => {
        setIsAISpeaking(false);
        // Generous acoustic silence buffer: 1400ms after audio finishes before microphone opens
        aiAudioBlockedUntilRef.current = Date.now() + 1400;
        setTimeout(() => {
          isAISpeakingRef.current = false;
          if (!isMutedRef.current && speechRecognitionRef.current) {
            try {
              speechRecognitionRef.current.start();
            } catch (e) {}
          }
        }, 1400);
      };

      utterance.onerror = () => {
        setIsAISpeaking(false);
        aiAudioBlockedUntilRef.current = Date.now() + 800;
        setTimeout(() => {
          isAISpeakingRef.current = false;
          if (!isMutedRef.current && speechRecognitionRef.current) {
            try {
              speechRecognitionRef.current.start();
            } catch (e) {}
          }
        }, 800);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleBargeIn = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsAISpeaking(false);
    isAISpeakingRef.current = false;
    aiAudioBlockedUntilRef.current = Date.now() + 300;
    setLiveCaption('');

    setTimeout(() => {
      if (!isMutedRef.current && speechRecognitionRef.current) {
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

  const handleCandidateUtterance = async (text) => {
    if (!text || isAISpeakingRef.current || Date.now() < aiAudioBlockedUntilRef.current) return;

    if (isEchoOfAI(text, recentAIPromptsRef.current)) {
      console.warn('Blocked acoustic echo utterance:', text);
      return;
    }

    appendTranscriptTurn('user', text, activeSection);
    setIsCandidateSpeaking(false);
    setLiveCaption('');

    // Trigger dynamic conversational follow-up turn
    setTimeout(() => {
      generateAdaptiveFollowup(text);
    }, 400);
  };

  const generateAdaptiveFollowup = async (candidateAnswer) => {
    setIsAIThinking(true);

    try {
      // 1. Call dynamic backend conversational agent (Groq qwen3.8-27b / Gemini 3.6 Flash)
      const res = await getNextTurn(sessionId, candidateAnswer);
      if (res?.success && res.aiResponse) {
        if (res.section) setActiveSection(res.section);
        setIsAIThinking(false);
        speakAIResponse(res.aiResponse);
        return;
      }
    } catch (err) {
      console.warn('Dynamic conversational agent call failed, using mode-specific fallback:', err);
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
    setShowEarlyEndModal(false);
    setIsEnding(true);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.abort();
      } catch (e) {}
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
      navigate(`/interview/results/${sessionId}`);
    } catch (err) {
      toast.dismiss('eval-loading');
      console.error('Failed to generate evaluation report:', err);
      toast.error('Could not complete evaluation analysis');
      navigate(`/interview/results/${sessionId}`);
    } finally {
      setIsEnding(false);
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

        {/* Controls: Voice Persona, Timer & Finish Button */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Natural Voice Selector */}
          <div className="flex items-center gap-1.5 bg-dark-950/80 border border-white/10 px-2.5 py-1.5 rounded-lg text-xs">
            <Volume2 className="w-3.5 h-3.5 text-neon-green shrink-0" />
            <select
              value={voiceGender}
              onChange={(e) => {
                setVoiceGender(e.target.value);
                toast.success(
                  `Voice set to ${
                    e.target.value === 'male' ? 'Alex / Adam (Natural Male)' : 'Bella / Jenny (Natural Female)'
                  }`
                );
              }}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="male" className="bg-dark-900 text-white">
                Alex (Natural Male)
              </option>
              <option value="female" className="bg-dark-900 text-white">
                Bella (Natural Female)
              </option>
            </select>
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
          {/* TrackAsap Rabbit AI Avatar (Three.js 3D WebGL with interactive 2.5D Mascot fallback) */}
          <RabbitAvatar
            isAISpeaking={isAISpeaking}
            isCandidateSpeaking={isCandidateSpeaking}
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
                  <span className="text-blue-400 font-semibold">Listening to you...</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-dark-500" />
                  <span className="text-dark-300">Your turn to answer — speak whenever you're ready</span>
                </>
              )}
            </div>

            {liveCaption && (
              <p className="text-xs text-dark-300 italic max-w-md mx-auto line-clamp-2 px-4">
                "{liveCaption}..."
              </p>
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
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-dark-400 px-1">
                    {isAI ? 'AI Interviewer' : 'You'}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      isAI
                        ? 'bg-dark-950 border border-neon-green/20 text-dark-100 rounded-tl-sm'
                        : 'bg-neon-green/10 border border-neon-green/30 text-white rounded-tr-sm'
                    }`}
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
