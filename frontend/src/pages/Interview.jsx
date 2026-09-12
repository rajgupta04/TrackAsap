import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Sparkles,
  Bot,
  BrainCircuit,
  FileText,
  Briefcase,
  Layers,
  Database,
  ArrowRight,
  Clock,
  Trophy,
  History,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Play,
} from 'lucide-react';
import { useInterviewStore } from '../store/interviewStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const MODES = [
  {
    id: 'general_sde',
    title: 'General SDE Round',
    badge: 'Popular',
    icon: Bot,
    color: 'from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400',
    description: 'Comprehensive software engineering interview: CS core, algorithms, design trade-offs, and HR fit.',
  },
  {
    id: 'resume_interview',
    title: 'Resume & Projects Deep Dive',
    badge: 'High Impact',
    icon: FileText,
    color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
    description: 'Drills deep into your actual projects, backend architectures, technical claims, and production trade-offs.',
  },
  {
    id: 'backend_interview',
    title: 'Backend Engineering',
    badge: 'Technical',
    icon: Database,
    color: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400',
    description: 'Node.js, SQL vs NoSQL, Redis caching, queues, microservices, and API security mechanisms.',
  },
  {
    id: 'system_design',
    title: 'System Design & Scalability',
    badge: 'Architecture',
    icon: Layers,
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    description: 'Design distributed architectures, scale databases, handle bottlenecks, and balance CAP trade-offs.',
  },
  {
    id: 'dsa_interview',
    title: 'Verbal DSA & Complexity',
    badge: 'Core',
    icon: BrainCircuit,
    color: 'from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400',
    description: 'Explain algorithmic intuition verbally, analyze Big-O time and space complexity, and walk through edge cases.',
  },
  {
    id: 'jd_interview',
    title: 'Target Job Description',
    badge: 'Custom',
    icon: Briefcase,
    color: 'from-teal-500/20 to-emerald-500/10 border-teal-500/30 text-teal-400',
    description: 'Paste any job posting or requirement sheet; the interviewer calibrates questions to the exact JD.',
  },
];

const Interview = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    sessions,
    totalSessions,
    isLoading,
    fetchSessions,
    fetchUserContext,
    userContext,
    createSession,
    deleteSession,
  } = useInterviewStore();

  const [selectedMode, setSelectedMode] = useState('general_sde');
  const [targetRole, setTargetRole] = useState('Software Development Engineer');
  const [targetCompany, setTargetCompany] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    fetchSessions(1, 6);
    fetchUserContext();
  }, [fetchSessions, fetchUserContext]);

  const handleStartInterview = async () => {
    setIsStarting(true);
    try {
      const res = await createSession({
        mode: selectedMode,
        targetRole,
        targetCompany,
        difficulty,
        durationMinutes,
        resumeText,
        jobDescription,
      });

      if (res.success && res.session?._id) {
        toast.success('Interview session initialized! Entering room...');
        navigate(`/interview/room/${res.session._id}`);
      } else {
        toast.error(res.error || 'Failed to start session');
      }
    } catch (err) {
      toast.error('Could not initialize interview room');
    } finally {
      setIsStarting(false);
    }
  };

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    if (window.confirm('Delete this interview session and transcript permanently?')) {
      await deleteSession(sessionId);
      toast.success('Interview session deleted');
    }
  };

  return (
    <div className="min-h-screen text-dark-100 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark-900/90 via-dark-900/60 to-dark-950 border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-neon-green/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-semibold uppercase tracking-wider">
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              Live Voice Realtime
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              AI Live Mock <span className="text-neon-green">Interviewer</span>
            </h1>
            <p className="text-sm sm:text-base text-dark-300 leading-relaxed">
              Practice answering technical questions out loud in real time. Features adaptive follow-ups,
              instant interruption handling (barge-in), and comprehensive post-interview feedback.
            </p>
          </div>

          {/* Quick Stats Pill */}
          {userContext?.dsaStats && (
            <div className="w-full md:w-auto bg-dark-950/80 border border-white/10 rounded-xl p-4 flex items-center gap-6">
              <div>
                <div className="text-xs text-dark-400 font-medium">DSA Solved</div>
                <div className="text-xl font-bold text-white mt-0.5">
                  {userContext.dsaStats.totalSolved}{' '}
                  <span className="text-xs text-neon-green font-normal">problems</span>
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="text-xs text-dark-400 font-medium">Completed Rounds</div>
                <div className="text-xl font-bold text-white mt-0.5">{totalSessions}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Mode Selection & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Select Interview Mode */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-neon-green" />
              1. Choose Interview Mode
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = selectedMode === mode.id;
                return (
                  <motion.div
                    key={mode.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`cursor-pointer rounded-xl p-4 border transition-all relative overflow-hidden ${
                      isSelected
                        ? 'bg-dark-900 border-neon-green shadow-lg shadow-neon-green/10'
                        : 'bg-dark-900/50 border-white/10 hover:border-white/20 hover:bg-dark-900/80'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2.5">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br border ${mode.color}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          isSelected
                            ? 'bg-neon-green/20 text-neon-green border-neon-green/40'
                            : 'bg-white/5 text-dark-400 border-white/10'
                        }`}
                      >
                        {mode.badge}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white text-sm mb-1">{mode.title}</h3>
                    <p className="text-xs text-dark-400 line-clamp-2 leading-relaxed">
                      {mode.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Section: Tailor Settings */}
          <div className="bg-dark-900/60 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-neon-green" />
              2. Calibrate Target Role & Experience
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5">
                  Target Position
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. SDE-1, Full Stack Developer"
                  className="w-full bg-dark-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-green transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5">
                  Target Company (Optional)
                </label>
                <input
                  type="text"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="e.g. Google, Amazon, Early-stage Startup"
                  className="w-full bg-dark-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-green transition-colors"
                />
              </div>
            </div>

            {/* Difficulty & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5">
                  Difficulty Calibration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['easy', 'medium', 'hard'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                        difficulty === diff
                          ? 'bg-neon-green/20 text-neon-green border-neon-green'
                          : 'bg-dark-950/60 text-dark-400 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5">
                  Target Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 20, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        durationMinutes === mins
                          ? 'bg-neon-green/20 text-neon-green border-neon-green'
                          : 'bg-dark-950/60 text-dark-400 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional Resume / JD Accordion */}
            <div className="pt-2 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5">
                  Resume Highlights or Project Claims (Optional)
                </label>
                <textarea
                  rows={3}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your top projects, tech stack claims, or key resume bullet points here..."
                  className="w-full bg-dark-950/80 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-neon-green transition-colors resize-none"
                />
              </div>

              {selectedMode === 'jd_interview' && (
                <div>
                  <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5">
                    Job Description (Required for JD Mode)
                  </label>
                  <textarea
                    rows={4}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job description requirements and expectations..."
                    className="w-full bg-dark-950/80 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-neon-green transition-colors resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Readiness & Launch Action */}
        <div className="space-y-6">
          {/* Action Box */}
          <div className="bg-gradient-to-b from-dark-900 to-dark-950 border border-neon-green/30 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-neon-green" />
                Ready to Practice?
              </h3>
              <p className="text-xs text-dark-300 leading-relaxed">
                Connect your microphone and speak naturally. The AI will start the round by greeting you and
                introducing the interview context.
              </p>
            </div>

            {/* Readiness Checklist */}
            <div className="space-y-2.5 text-xs text-dark-300 bg-dark-950/60 rounded-xl p-3.5 border border-white/5">
              <div className="flex items-center gap-2 text-white font-medium">
                <CheckCircle2 className="w-4 h-4 text-neon-green shrink-0" />
                Quiet room & functional microphone
              </div>
              <div className="flex items-center gap-2 text-white font-medium">
                <CheckCircle2 className="w-4 h-4 text-neon-green shrink-0" />
                Barge-in enabled: interrupt AI anytime
              </div>
              <div className="flex items-center gap-2 text-white font-medium">
                <CheckCircle2 className="w-4 h-4 text-neon-green shrink-0" />
                Automated rubric report upon completion
              </div>
            </div>

            <button
              type="button"
              disabled={isStarting}
              onClick={handleStartInterview}
              className="w-full flex items-center justify-center gap-3 bg-neon-green hover:bg-neon-green/90 text-dark-950 font-bold py-3.5 px-6 rounded-xl text-sm transition-all transform active:scale-95 shadow-lg shadow-neon-green/20 disabled:opacity-50"
            >
              {isStarting ? (
                <>
                  <div className="w-4 h-4 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                  Initializing Room...
                </>
              ) : (
                <>
                  Start Voice Interview
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Past Interviews History */}
          <div className="bg-dark-900/50 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-neon-green" />
                Recent Practice Rounds
              </h3>
              <span className="text-xs text-dark-400">{sessions.length} sessions</span>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-6 text-xs text-dark-400">
                No past sessions yet. Start your first mock interview above!
              </div>
            ) : (
              <div className="space-y-2.5">
                {sessions.map((sess) => {
                  const score = sess.evaluation?.overallScore;
                  return (
                    <div
                      key={sess._id}
                      onClick={() => navigate(`/interview/results/${sess._id}`)}
                      className="group cursor-pointer bg-dark-950/70 hover:bg-dark-950 border border-white/5 hover:border-neon-green/40 rounded-xl p-3 flex items-center justify-between transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-white group-hover:text-neon-green transition-colors">
                          {sess.targetRole || 'Software Engineer'}
                        </div>
                        <div className="text-[11px] text-dark-400 flex items-center gap-2">
                          <span className="capitalize">{sess.mode.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{new Date(sess.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {score ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-neon-green/10 text-neon-green border border-neon-green/30">
                            {score.toFixed(1)}/10
                          </span>
                        ) : (
                          <span className="text-[10px] text-dark-500 uppercase">In progress</span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, sess._id)}
                          className="text-dark-500 hover:text-red-400 p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
