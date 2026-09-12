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
  } = useInterviewStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false);
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

  // Echo detection helper
  const isEchoOfAI = (userText, aiText) => {
    if (!aiText || !userText) return false;
    const cleanUser = userText.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const cleanAI = aiText.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    if (cleanUser.length >= 8 && cleanAI.includes(cleanUser)) {
      return true;
    }
    return false;
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
        // CRITICAL: Drop any microphone audio picked up while AI is outputting sound (Acoustic Echo Guard)
        if (isAISpeakingRef.current) {
          return;
        }

        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;

        if (event.results[current].isFinal) {
          setIsCandidateSpeaking(false);
          setLiveCaption('');
          const trimmed = transcriptText.trim();
          
          // Ensure it's not a residual echo of the AI's question
          if (trimmed && !isEchoOfAI(trimmed, lastAITextRef.current)) {
            handleCandidateUtterance(trimmed);
          }
        } else {
          setIsCandidateSpeaking(true);
          setLiveCaption(transcriptText);
        }
      };

      recognition.onend = () => {
        // Automatically restart speech recognition when listening to candidate
        if (!isAISpeakingRef.current && !isMutedRef.current) {
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

    // AI Initial greeting if empty transcript
    const initialTimeout = setTimeout(() => {
      if (transcript.length === 0) {
        speakAIResponse(
          `Hello ${user?.name || 'there'}! Welcome to your ${
            currentSession?.targetRole || 'Software Engineering'
          } mock interview. Let's get started. Could you briefly introduce yourself and tell me about a recent project you built?`
        );
      }
    }, 1000);

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
    appendTranscriptTurn('ai', text, activeSection);

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();

      // Immediately flag AI as speaking and abort microphone input
      isAISpeakingRef.current = true;
      setIsAISpeaking(true);
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort();
        } catch (e) {}
      }

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
        setIsAISpeaking(true);
      };

      utterance.onend = () => {
        setIsAISpeaking(false);
        // Safety buffer: wait 500ms after audio finishes before opening microphone to eliminate speaker echo
        setTimeout(() => {
          isAISpeakingRef.current = false;
          if (!isMutedRef.current && speechRecognitionRef.current) {
            try {
              speechRecognitionRef.current.start();
            } catch (e) {}
          }
        }, 500);
      };

      utterance.onerror = () => {
        setIsAISpeaking(false);
        isAISpeakingRef.current = false;
        if (!isMutedRef.current && speechRecognitionRef.current) {
          try {
            speechRecognitionRef.current.start();
          } catch (e) {}
        }
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

    if (!isMutedRef.current && speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.start();
      } catch (e) {}
    }

    toast('Interrupted AI — listening to you now!', {
      icon: '⚡',
      style: { background: '#18181b', color: '#39ff14', border: '1px solid #39ff14' },
      duration: 1500,
    });
  };

  const handleCandidateUtterance = async (text) => {
    if (!text || isAISpeakingRef.current) return;

    appendTranscriptTurn('user', text, activeSection);

    // Give candidate a moment before AI prepares response
    setTimeout(() => {
      generateAdaptiveFollowup(text);
    }, 600);
  };

  const generateAdaptiveFollowup = (candidateAnswer) => {
    const lower = candidateAnswer.toLowerCase();
    let followUp = '';

    if (lower.includes('mongodb') || lower.includes('database')) {
      followUp =
        "Interesting choice with MongoDB. How did you structure your indexes to avoid collection scans on frequent queries, and why didn't you choose a relational database like PostgreSQL?";
      setActiveSection('technical');
    } else if (lower.includes('redis') || lower.includes('cache')) {
      followUp =
        'You mentioned Redis. What cache eviction policy did you configure, and how did you handle cache stampede or invalidation when records update?';
      setActiveSection('system_design');
    } else if (lower.includes('jwt') || lower.includes('auth')) {
      followUp =
        'Good. When implementing JWT authentication, where do you store the tokens on the client to protect against XSS and CSRF attacks?';
      setActiveSection('technical');
    } else if (candidateAnswer.split(' ').length < 15) {
      followUp =
        'Could you elaborate on that a bit more? Specifically, what were the major engineering trade-offs you considered?';
    } else {
      followUp =
        'Got it. If traffic scaled by 50x tomorrow, what would be the first point of failure in this architecture, and how would you mitigate it?';
      setActiveSection('system_design');
    }

    speakAIResponse(followUp);
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
              {isAISpeaking ? (
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
