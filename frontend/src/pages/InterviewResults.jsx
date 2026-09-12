import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mic,
  ArrowRight,
  RefreshCw,
  LayoutDashboard,
  BrainCircuit,
  MessageSquare,
  HelpCircle,
  Activity,
  Layers,
} from 'lucide-react';
import { useInterviewStore } from '../store/interviewStore';
import toast from 'react-hot-toast';

const InterviewResults = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { currentSession, fetchSession, isLoading } = useInterviewStore();
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    }
  }, [sessionId, fetchSession]);

  if (isLoading || !currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-dark-400 font-medium">Loading interview evaluation...</span>
        </div>
      </div>
    );
  }

  const evaluation = currentSession.evaluation || {};
  const isIncomplete = Boolean(evaluation.incomplete || (evaluation.overallScore === 0 && (!evaluation.strengths || evaluation.strengths.length <= 1)));
  const overallScore = evaluation.overallScore || 0;
  const categories = evaluation.categories || {
    technicalKnowledge: 0,
    problemSolving: 0,
    communication: 0,
    projectDepth: 0,
    systemDesign: 0,
    confidence: 0,
  };
  const voiceMetrics = evaluation.voiceMetrics || {};

  const getScoreVerdict = (score, incomplete) => {
    if (incomplete || score === 0) {
      return { text: 'Incomplete / Aborted Early', color: 'text-amber-400' };
    }
    if (score >= 8.5) return { text: 'Strong Hire / Exceptional', color: 'text-neon-green' };
    if (score >= 7.0) return { text: 'Solid Hire / Passed Bar', color: 'text-emerald-400' };
    if (score >= 5.5) return { text: 'Borderline / Needs Revision', color: 'text-amber-400' };
    return { text: 'Needs Improvement', color: 'text-rose-400' };
  };

  const verdict = getScoreVerdict(overallScore, isIncomplete);

  return (
    <div className="min-h-screen text-dark-100 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="text-xs uppercase font-semibold text-neon-green tracking-wider mb-1">
            Performance Audit Report
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Interview <span className="text-neon-green">Evaluation</span>
          </h1>
          <p className="text-xs sm:text-sm text-dark-400 mt-1 capitalize">
            {currentSession.targetRole || 'Software Development Engineer'} •{' '}
            {currentSession.mode?.replace('_', ' ')} •{' '}
            {new Date(currentSession.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/interview')}
            className="flex items-center gap-2 bg-dark-900 hover:bg-dark-800 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Practice Again
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 bg-neon-green hover:bg-neon-green/90 text-dark-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-neon-green/20"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>
        </div>
      </div>

      {/* Early Termination Warning Banner */}
      {isIncomplete && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                Interview Concluded Prematurely
              </div>
              <p className="text-xs text-dark-300 mt-0.5 leading-relaxed">
                {evaluation.reason ||
                  'The interview was ended before technical questioning began. No technical answers were recorded to evaluate competencies.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/interview')}
            className="shrink-0 bg-neon-green hover:bg-neon-green/90 text-dark-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-neon-green/20"
          >
            Start New Round
          </button>
        </div>
      )}

      {/* Top Cards: Score Gauge & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Score Badge */}
        <div
          className={`bg-gradient-to-br from-dark-900 to-dark-950 border rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl ${
            isIncomplete ? 'border-amber-500/30' : 'border-neon-green/30'
          }`}
        >
          <div
            className={`absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
              isIncomplete ? 'bg-amber-500/10' : 'bg-neon-green/10'
            }`}
          />
          {isIncomplete ? (
            <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
          ) : (
            <Trophy className="w-10 h-10 text-neon-green mb-3 animate-pulse" />
          )}
          <div className="text-5xl font-black text-white tracking-tight">
            {overallScore > 0 ? overallScore.toFixed(1) : '0.0'}
            <span className="text-lg text-dark-400 font-normal">/10</span>
          </div>
          <div className={`text-sm font-bold mt-2 ${verdict.color}`}>{verdict.text}</div>
          <p className="text-xs text-dark-400 mt-2 max-w-xs leading-relaxed">
            {evaluation.detailedFeedback ||
              evaluation.reason ||
              'Complete a full interview round to receive comprehensive technical feedback.'}
          </p>
        </div>

        {/* Competency Category Breakdown */}
        <div className="lg:col-span-2 bg-dark-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-neon-green" />
            Competency Breakdown
          </h2>

          <div className="space-y-3 pt-1">
            {Object.entries(categories).map(([key, val]) => {
              const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase());
              const percent = Math.min(100, Math.round((val / 10) * 100));

              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-dark-300">{label}</span>
                    <span className="text-white font-mono font-bold">
                      {val.toFixed(1)} <span className="text-dark-500 font-normal">/10</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-dark-950 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-neon-green rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Voice Delivery & Objective Metrics */}
      <div className="bg-dark-900/40 border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-neon-green" />
          Speech & Delivery Signals
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-dark-950/80 border border-white/5 rounded-xl p-3.5 text-center">
            <div className="text-[11px] font-medium text-dark-400">Speaking Pace</div>
            <div className="text-xl font-bold text-white mt-1">
              {voiceMetrics.wpm ?? 0}{' '}
              <span className="text-xs text-dark-400 font-normal">WPM</span>
            </div>
            <div className="text-[10px] text-neon-green mt-0.5">
              {(voiceMetrics.wpm ?? 0) > 0 ? 'Ideal (120-150 WPM)' : 'No speech recorded'}
            </div>
          </div>

          <div className="bg-dark-950/80 border border-white/5 rounded-xl p-3.5 text-center">
            <div className="text-[11px] font-medium text-dark-400">Speaking Time</div>
            <div className="text-xl font-bold text-white mt-1">
              {voiceMetrics.totalSpeakingTimeSec !== undefined
                ? `${Math.round(voiceMetrics.totalSpeakingTimeSec)}s`
                : '0s'}
            </div>
            <div className="text-[10px] text-dark-400 mt-0.5">Active voice output</div>
          </div>

          <div className="bg-dark-950/80 border border-white/5 rounded-xl p-3.5 text-center">
            <div className="text-[11px] font-medium text-dark-400">Filler Words</div>
            <div className="text-xl font-bold text-white mt-1">
              {voiceMetrics.fillerWordCount ?? 0}
            </div>
            <div className="text-[10px] text-dark-400 mt-0.5">"um", "like", "basically"</div>
          </div>

          <div className="bg-dark-950/80 border border-white/5 rounded-xl p-3.5 text-center">
            <div className="text-[11px] font-medium text-dark-400">Speaking Turns</div>
            <div className="text-xl font-bold text-white mt-1">
              {voiceMetrics.userTurns ??
                (currentSession.transcript?.filter((t) => t.speaker === 'user').length || 0)}
            </div>
            <div className="text-[10px] text-dark-400 mt-0.5">Candidate turns</div>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-dark-900/50 border border-emerald-500/20 rounded-2xl p-6 space-y-3.5">
          <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Observed Strengths
          </h2>
          <ul className="space-y-2.5 text-xs text-dark-200">
            {(evaluation.strengths || []).map((s, i) => (
              <li key={i} className="flex items-start gap-2 leading-relaxed">
                <span className="text-neon-green shrink-0 mt-0.5">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses / Gaps */}
        <div className="bg-dark-900/50 border border-amber-500/20 rounded-2xl p-6 space-y-3.5">
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Key Areas for Improvement
          </h2>
          <ul className="space-y-2.5 text-xs text-dark-200">
            {(evaluation.weaknesses || []).map((w, i) => (
              <li key={i} className="flex items-start gap-2 leading-relaxed">
                <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Incorrect Answers & Technical Guidance */}
      {evaluation.incorrectAnswers && evaluation.incorrectAnswers.length > 0 && (
        <div className="bg-dark-900/50 border border-rose-500/20 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            Technical Gaps & Correction Guidance
          </h2>
          <div className="space-y-3">
            {evaluation.incorrectAnswers.map((item, i) => (
              <div
                key={i}
                className="bg-dark-950/70 border border-white/5 rounded-xl p-4 space-y-2 text-xs"
              >
                <div className="font-semibold text-white">
                  <span className="text-rose-400 font-bold mr-1.5">Q:</span>
                  {item.question}
                </div>
                {item.candidateAnswer && (
                  <div className="text-dark-300 pl-4 border-l-2 border-rose-500/40">
                    <span className="text-dark-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                      Your Answer:
                    </span>
                    {item.candidateAnswer}
                  </div>
                )}
                {item.correctGuidance && (
                  <div className="text-emerald-300 pl-4 border-l-2 border-emerald-500/40 bg-emerald-500/5 p-2 rounded-r-lg">
                    <span className="text-emerald-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                      Optimal Guidance / What to Say:
                    </span>
                    {item.correctGuidance}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Revision Topics */}
      {evaluation.areasToRevise && evaluation.areasToRevise.length > 0 && (
        <div className="bg-dark-900/50 border border-white/10 rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-neon-green" />
            Recommended Concepts to Revise
          </h2>
          <div className="flex flex-wrap gap-2">
            {evaluation.areasToRevise.map((topic, i) => (
              <span
                key={i}
                className="text-xs px-3 py-1 rounded-xl bg-dark-950 border border-neon-green/30 text-neon-green font-medium"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible Transcript Section */}
      <div className="bg-dark-900/40 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-neon-green" />
            Full Interview Transcript ({currentSession.transcript?.length || 0} turns)
          </h2>
          <button
            type="button"
            onClick={() => setShowFullTranscript(!showFullTranscript)}
            className="text-xs font-semibold text-neon-green hover:underline"
          >
            {showFullTranscript ? 'Hide Transcript' : 'Show Transcript'}
          </button>
        </div>

        {showFullTranscript && (
          <div className="space-y-3 pt-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
            {(currentSession.transcript || []).map((turn, i) => {
              const isAI = turn.speaker === 'ai';
              return (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    isAI
                      ? 'bg-dark-950/80 border-white/10 text-dark-200'
                      : 'bg-neon-green/5 border-neon-green/20 text-white'
                  }`}
                >
                  <div className="font-semibold text-[11px] uppercase tracking-wider text-dark-400 mb-1">
                    {isAI ? 'AI Interviewer' : 'Candidate'}
                  </div>
                  <div>{turn.text}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewResults;
