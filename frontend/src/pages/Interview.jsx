import { useState, useEffect, useRef } from 'react';
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
  UploadCloud,
  X,
  FileCheck,
  Eye,
  Loader2,
  Users,
  Volume2,
} from 'lucide-react';
import { useInterviewStore } from '../store/interviewStore';
import { useAuthStore } from '../store/authStore';
import { interviewService } from '../services/interviewService';
import ConfirmModal from '../components/interview/ConfirmModal';
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

const INTERVIEWER_OPTIONS = [
  {
    id: 'alex',
    title: 'Alex Rivera (1:1)',
    format: 'Single Interviewer',
    badge: 'Natural Male',
    role: 'Lead Systems Architect',
    emoji: '⚡',
    color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
    description: 'Direct 1-on-1 interview with Alex using high-fidelity natural male voice. Focuses on architecture, clean code, and design.',
  },
  {
    id: 'bella',
    title: 'Dr. Bella Chen (1:1)',
    format: 'Single Interviewer',
    badge: 'Natural Female',
    role: 'Staff Algorithms Lead',
    emoji: '🧠',
    color: 'from-pink-500/20 to-purple-500/10 border-pink-500/30 text-pink-400',
    description: 'Direct 1-on-1 interview with Dr. Bella using high-fidelity natural female voice. Focuses on algorithms and optimization.',
  },
  {
    id: 'multi_panel',
    title: 'Multi-Panel Board',
    format: '2-Person Technical Board',
    badge: 'Dynamic Team',
    role: 'Alex & Dr. Bella Alternating',
    emoji: '🤼',
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    description: 'Simulates a real FAANG board loop: Alex and Dr. Bella take turns questioning you across rounds with natural voices.',
  },
  {
    id: 'random',
    title: 'Random Interviewer',
    format: 'Surprise Setup',
    badge: 'Surprise Me',
    role: 'Alex or Dr. Bella Assigned',
    emoji: '🎲',
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    description: 'Randomly assigns either Alex (Natural Male) or Dr. Bella (Natural Female) when the room begins.',
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
  const [resumeTab, setResumeTab] = useState('upload'); // 'upload' | 'paste'
  const [resumeFile, setResumeFile] = useState(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showExtractedPreview, setShowExtractedPreview] = useState(false);
  const fileInputRef = useRef(null);
  const [isStarting, setIsStarting] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [interviewerPersona, setInterviewerPersona] = useState(() => {
    return localStorage.getItem('trackasap_interview_persona') || 'alex';
  });

  const currentInterviewerOption =
    INTERVIEWER_OPTIONS.find((opt) => opt.id === interviewerPersona) ||
    INTERVIEWER_OPTIONS[0];

  useEffect(() => {
    fetchSessions(1, 6);
    fetchUserContext();
  }, [fetchSessions, fetchUserContext]);

  const handleResumeUpload = async (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resume file size must be less than 5MB');
      return;
    }

    setIsUploadingResume(true);
    const toastId = toast.loading(`Parsing ${file.name}...`, { id: 'resume-upload' });

    try {
      const data = await interviewService.uploadResume(file);
      toast.dismiss('resume-upload');

      if (data.success && data.text) {
        setResumeText(data.text);
        setResumeFile({
          name: data.fileName || file.name,
          size: data.fileSize || file.size,
        });
        toast.success('Resume parsed successfully! Projects & skills extracted.');
      } else {
        toast.error('Could not extract text from this resume');
      }
    } catch (err) {
      toast.dismiss('resume-upload');
      console.error('Resume upload error:', err);
      toast.error(err.response?.data?.message || 'Failed to parse resume document');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleStartInterview = async () => {
    setIsStarting(true);
    try {
      localStorage.setItem('trackasap_interview_persona', interviewerPersona);
      const res = await createSession({
        mode: selectedMode,
        targetRole,
        targetCompany,
        difficulty,
        durationMinutes,
        resumeText,
        jobDescription,
        interviewerPersona,
        interviewerMode:
          interviewerPersona === 'multi_panel'
            ? 'multi_panel'
            : interviewerPersona === 'random'
            ? 'random'
            : 'single',
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

  const openDeleteModal = (e, session) => {
    e.stopPropagation();
    setSessionToDelete(session);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSession(sessionToDelete._id);
      toast.success('Interview session permanently deleted');
      setSessionToDelete(null);
    } catch (err) {
      toast.error('Failed to delete session');
    } finally {
      setIsDeleting(false);
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

            {/* Resume Upload & Project Claims Section */}
            <div className="pt-2 space-y-3">
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  selectedMode === 'resume_interview'
                    ? 'bg-blue-500/5 border-blue-500/40 shadow-lg shadow-blue-500/5'
                    : 'bg-dark-950/60 border-white/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <FileText
                      className={`w-4 h-4 ${
                        selectedMode === 'resume_interview' ? 'text-blue-400' : 'text-neon-green'
                      }`}
                    />
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">
                        Candidate Resume / Projects
                      </span>
                      <span className="text-[11px] text-dark-400">
                        {selectedMode === 'resume_interview'
                          ? 'Required for Deep Dive: AI questions your real projects & architectures'
                          : 'Optional: Tailors interview questions to your background'}
                      </span>
                    </div>
                  </div>

                  {/* Mode Switcher Tabs */}
                  <div className="flex items-center self-start sm:self-auto bg-dark-900 border border-white/10 rounded-xl p-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setResumeTab('upload')}
                      className={`px-3 py-1 rounded-lg transition-all font-medium ${
                        resumeTab === 'upload'
                          ? 'bg-neon-green text-dark-950 font-bold shadow-sm'
                          : 'text-dark-400 hover:text-white'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setResumeTab('paste')}
                      className={`px-3 py-1 rounded-lg transition-all font-medium ${
                        resumeTab === 'paste'
                          ? 'bg-neon-green text-dark-950 font-bold shadow-sm'
                          : 'text-dark-400 hover:text-white'
                      }`}
                    >
                      Paste Text
                    </button>
                  </div>
                </div>

                {resumeTab === 'upload' ? (
                  <div className="space-y-3">
                    {resumeFile ? (
                      <div className="bg-dark-900/90 border border-emerald-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                            <FileCheck className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate max-w-xs">
                              {resumeFile.name}
                            </div>
                            <div className="text-[10px] text-dark-400 flex items-center gap-2 mt-0.5">
                              <span>{(resumeFile.size / 1024).toFixed(1)} KB</span>
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Extracted & Ready for AI
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setShowExtractedPreview(!showExtractedPreview)}
                            className="px-2.5 py-1.5 rounded-lg bg-dark-950 hover:bg-dark-800 border border-white/10 text-xs text-dark-300 hover:text-white transition-all flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-neon-green" />
                            {showExtractedPreview ? 'Hide Details' : 'View Extracted Details'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setResumeFile(null);
                              setResumeText('');
                              setShowExtractedPreview(false);
                            }}
                            className="p-1.5 rounded-lg bg-dark-950 hover:bg-red-500/20 border border-white/10 text-dark-400 hover:text-rose-400 transition-all"
                            title="Remove Resume"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleResumeUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                          isDragging
                            ? 'border-neon-green bg-neon-green/10'
                            : 'border-white/15 bg-dark-900/40 hover:border-white/30 hover:bg-dark-900/70'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.docx,.doc,.txt,.md,image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleResumeUpload(e.target.files[0]);
                            }
                          }}
                        />
                        {isUploadingResume ? (
                          <div className="flex flex-col items-center gap-2 py-2">
                            <Loader2 className="w-7 h-7 text-neon-green animate-spin" />
                            <div className="text-xs font-semibold text-white">
                              Analyzing & Extracting Resume Profile...
                            </div>
                            <div className="text-[11px] text-dark-400">
                              AI is extracting your technical projects, stack, and metrics
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center text-neon-green mb-1">
                              <UploadCloud className="w-5 h-5" />
                            </div>
                            <div className="text-xs font-bold text-white">
                              Drop your resume file here or{' '}
                              <span className="text-neon-green underline">Browse</span>
                            </div>
                            <p className="text-[11px] text-dark-400">
                              Supports PDF, DOCX, DOC, TXT, MD, Images (Max 5MB)
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Extracted preview accordion */}
                    {showExtractedPreview && resumeText && (
                      <div className="p-3.5 bg-dark-950 border border-white/10 rounded-xl text-xs text-dark-200 font-mono whitespace-pre-wrap max-h-52 overflow-y-auto scrollbar-thin">
                        <div className="text-[10px] uppercase font-bold text-neon-green mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Parsed Profile That AI Will Reference:
                        </div>
                        {resumeText}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={4}
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your top projects, technical architecture claims, and key achievements here..."
                      className="w-full bg-dark-900/80 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-neon-green transition-colors resize-none"
                    />
                  </div>
                )}
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

          {/* Section: Interviewer Setup (1:1 vs Multi-Panel Board) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-neon-green" />
                3. Choose Interviewer Setup
              </h2>
              <span className="text-xs text-neon-green/90 font-medium px-2.5 py-0.5 rounded-full bg-neon-green/10 border border-neon-green/20">
                ✨ High-Fidelity Natural Voices
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {INTERVIEWER_OPTIONS.map((opt) => {
                const isSelected = interviewerPersona === opt.id;
                return (
                  <motion.div
                    key={opt.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setInterviewerPersona(opt.id);
                      localStorage.setItem('trackasap_interview_persona', opt.id);
                      toast.success(`Interviewer format set to: ${opt.title}`);
                    }}
                    className={`cursor-pointer rounded-xl p-4 border transition-all relative overflow-hidden ${
                      isSelected
                        ? 'bg-dark-900 border-neon-green shadow-lg shadow-neon-green/10 ring-1 ring-neon-green/40'
                        : 'bg-dark-900/50 border-white/10 hover:border-white/20 hover:bg-dark-900/80'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{opt.emoji}</span>
                        <div>
                          <h3 className="font-bold text-white text-sm leading-tight flex items-center gap-1.5">
                            {opt.title}
                          </h3>
                          <span className="text-[11px] text-dark-400 block font-mono">
                            {opt.role}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isSelected
                            ? 'bg-neon-green/20 text-neon-green border-neon-green/40'
                            : 'bg-white/5 text-dark-400 border-white/10'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-xs text-dark-400 line-clamp-2 leading-relaxed mt-1">
                      {opt.description}
                    </p>
                  </motion.div>
                );
              })}
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

            {/* Selected Interviewer & Mode Summary */}
            <div className="bg-dark-950/90 border border-white/10 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-dark-300">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-dark-400">Interviewer</span>
                <span className="text-white font-bold flex items-center gap-1.5">
                  <span>{currentInterviewerOption.emoji}</span>
                  <span>{currentInterviewerOption.title}</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-dark-300">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-dark-400">Voice Quality</span>
                <span className="text-neon-green font-semibold flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-neon-green" />
                  Natural Human
                </span>
              </div>
              <div className="flex items-center justify-between text-dark-300">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-dark-400">Setup Mode</span>
                <span className="text-white font-medium">{currentInterviewerOption.badge}</span>
              </div>
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
                          onClick={(e) => openDeleteModal(e, sess)}
                          className="text-dark-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete interview session"
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

      {/* Custom Confirmation Modal for Deleting Sessions */}
      <ConfirmModal
        isOpen={Boolean(sessionToDelete)}
        onClose={() => setSessionToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Interview Session"
        description="Permanently delete this interview session, performance scores, and audio transcript? This cannot be undone."
        confirmText="Delete Permanently"
        variant="danger"
        icon={Trash2}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Interview;
