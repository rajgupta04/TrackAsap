import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, subDays, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Save,
  Code2,
  Trophy,
  Dumbbell,
  Apple,
  BookOpen,
  Loader2,
  Trash2,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { useDailyLogStore } from '../store/dailyLogStore';
import { useAuthStore } from '../store/authStore';
import useProblemStore from '../store/problemStore';
import GlassCard from '../components/ui/GlassCard';
import Checkbox from '../components/ui/Checkbox';
import NumberInput from '../components/ui/NumberInput';
import Select from '../components/ui/Select';
import ProgressRing from '../components/ui/ProgressRing';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ProblemModal from '../components/ProblemModal';
import StreakAnimation from '../components/StreakAnimation';

const workoutTypes = [
  { value: 'none', label: 'None' },
  { value: 'push', label: 'Push Day' },
  { value: 'pull', label: 'Pull Day' },
  { value: 'legs', label: 'Leg Day' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'rest', label: 'Rest Day' },
  { value: 'other', label: 'Other' },
];

const difficultyOptions = [
  { value: 'none', label: 'None' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const DailyTracker = () => {
  const { user } = useAuthStore();
  const {
    currentLog,
    selectedDate,
    setSelectedDate,
    fetchLogByDate,
    saveLog,
    updateCurrentLog,
    deleteLog,
    isLoading,
    isSaving,
  } = useDailyLogStore();

  const { problems, fetchProblemsByDate } = useProblemStore();

  const [localDate, setLocalDate] = useState(selectedDate);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todayProblems, setTodayProblems] = useState([]);

  useEffect(() => {
    fetchLogByDate(selectedDate);
    loadTodayProblems(selectedDate);
  }, [selectedDate]);

  const loadTodayProblems = async (date) => {
    const probs = await fetchProblemsByDate(date);
    setTodayProblems(probs || []);
  };

  const handleDateChange = (date) => {
    setLocalDate(date);
    setSelectedDate(date);
  };

  const handlePrevDay = () => {
    const prev = format(subDays(parseISO(localDate), 1), 'yyyy-MM-dd');
    handleDateChange(prev);
  };

  const handleNextDay = () => {
    const next = format(addDays(parseISO(localDate), 1), 'yyyy-MM-dd');
    handleDateChange(next);
  };

  const handleSave = async () => {
    if (!currentLog) return;

    const result = await saveLog(currentLog);
    if (result.success) {
      toast.success('Daily log saved!');
      
      // Check if day is complete (60%+ score) and show streak animation
      const score = calculateCompletionScore();
      if (score >= 60 && result.data?.streak) {
        setCurrentStreak(result.data.streak);
        setShowStreakAnimation(true);
      }
    } else {
      toast.error(result.error || 'Failed to save');
    }
  };

  const handleAddProblem = (platform) => {
    setSelectedPlatform(platform);
    setShowProblemModal(true);
  };

  const handleProblemAdded = () => {
    loadTodayProblems(selectedDate);
    // Update the problems count
    if (selectedPlatform && currentLog) {
      const platformKey = selectedPlatform;
      const currentSolved = currentLog[platformKey]?.problemsSolved || 0;
      updateCurrentLog(`${platformKey}.problemsSolved`, currentSolved + 1);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this log?')) {
      const result = await deleteLog(selectedDate);
      if (result.success) {
        toast.success('Log deleted');
        fetchLogByDate(selectedDate);
      }
    }
  };

  // Calculate completion score
  const calculateCompletionScore = () => {
    if (!currentLog) return 0;
    let score = 0;
    const totalChecks = 5;

    if (currentLog.leetcode?.problemsSolved > 0 || currentLog.leetcode?.contestParticipated) score++;
    if (currentLog.codechef?.dailyProblem || currentLog.codechef?.contestParticipated) score++;
    if (currentLog.codeforces?.problemsSolved > 0 || currentLog.codeforces?.contestParticipated) score++;
    if (currentLog.gym?.completed) score++;
    if (currentLog.diet?.cleanDiet) score++;

    return Math.round((score / totalChecks) * 100);
  };

  // Calculate day number
  const getDayNumber = () => {
    if (!user?.startDate) return 1;
    const start = new Date(user.startDate);
    start.setHours(0, 0, 0, 0);
    const selected = parseISO(localDate);
    selected.setHours(0, 0, 0, 0);
    const diff = Math.floor((selected - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, Math.min(75, diff));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const dayNumber = getDayNumber();
  const completionScore = calculateCompletionScore();

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Date Navigation */}
      <GlassCard className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-neon-green" />
            <input
              type="date"
              value={localDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent text-white text-lg font-semibold focus:outline-none"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 text-white transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-dark-400 text-sm">Day</p>
            <p className="text-2xl font-bold text-neon-green">{dayNumber}</p>
          </div>
          <ProgressRing progress={completionScore} size={70} strokeWidth={5} />
        </div>
      </GlassCard>

      {/* Coding Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* LeetCode */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFA116]/10 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-[#FFA116]" />
              </div>
              <h3 className="text-lg font-semibold text-white">LeetCode</h3>
            </div>
            <button
              onClick={() => handleAddProblem('leetcode')}
              className="p-2 rounded-lg bg-[#FFA116]/10 text-[#FFA116] hover:bg-[#FFA116]/20 transition-colors"
              title="Add Problem"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <Checkbox
              checked={currentLog?.leetcode?.contestParticipated || false}
              onChange={(val) => updateCurrentLog('leetcode.contestParticipated', val)}
              label="Contest Participated"
            />

            <NumberInput
              label="Problems Solved"
              value={currentLog?.leetcode?.problemsSolved}
              onChange={(val) => updateCurrentLog('leetcode.problemsSolved', val)}
              min={0}
              max={50}
            />

            <Select
              label="Difficulty"
              value={currentLog?.leetcode?.problemDifficulty || 'none'}
              onChange={(val) => updateCurrentLog('leetcode.problemDifficulty', val)}
              options={difficultyOptions}
            />

            {/* Today's LeetCode problems */}
            {todayProblems.filter(p => p.platform === 'leetcode').length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-gray-400 mb-2">Today's Problems:</p>
                <div className="space-y-1">
                  {todayProblems.filter(p => p.platform === 'leetcode').map((p) => (
                    <a
                      key={p._id}
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-300 hover:text-[#FFA116] transition-colors"
                    >
                      <span className="truncate flex-1">{p.title}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* CodeChef */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5B4638]/20 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-[#a07a5a]" />
              </div>
              <h3 className="text-lg font-semibold text-white">CodeChef</h3>
            </div>
            <button
              onClick={() => handleAddProblem('codechef')}
              className="p-2 rounded-lg bg-[#5B4638]/20 text-[#a07a5a] hover:bg-[#5B4638]/30 transition-colors"
              title="Add Problem"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <Checkbox
              checked={currentLog?.codechef?.dailyProblem || false}
              onChange={(val) => updateCurrentLog('codechef.dailyProblem', val)}
              label="Daily Problem"
            />

            <Checkbox
              checked={currentLog?.codechef?.contestParticipated || false}
              onChange={(val) => updateCurrentLog('codechef.contestParticipated', val)}
              label="Contest Participated"
            />

            <NumberInput
              label="Problems Solved"
              value={currentLog?.codechef?.problemsSolved}
              onChange={(val) => updateCurrentLog('codechef.problemsSolved', val)}
              min={0}
              max={50}
            />

            {/* Today's CodeChef problems */}
            {todayProblems.filter(p => p.platform === 'codechef').length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-gray-400 mb-2">Today's Problems:</p>
                <div className="space-y-1">
                  {todayProblems.filter(p => p.platform === 'codechef').map((p) => (
                    <a
                      key={p._id}
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-300 hover:text-[#a07a5a] transition-colors"
                    >
                      <span className="truncate flex-1">{p.title}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Codeforces */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1F8ACB]/10 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-[#1F8ACB]" />
              </div>
              <h3 className="text-lg font-semibold text-white">Codeforces</h3>
            </div>
            <button
              onClick={() => handleAddProblem('codeforces')}
              className="p-2 rounded-lg bg-[#1F8ACB]/10 text-[#1F8ACB] hover:bg-[#1F8ACB]/20 transition-colors"
              title="Add Problem"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <Checkbox
              checked={currentLog?.codeforces?.contestParticipated || false}
              onChange={(val) => updateCurrentLog('codeforces.contestParticipated', val)}
              label="Contest Participated"
            />

            <NumberInput
              label="Problems Solved"
              value={currentLog?.codeforces?.problemsSolved}
              onChange={(val) => updateCurrentLog('codeforces.problemsSolved', val)}
              min={0}
              max={50}
            />

            <NumberInput
              label="Rating (if updated)"
              value={currentLog?.codeforces?.rating}
              onChange={(val) => updateCurrentLog('codeforces.rating', val)}
              min={0}
              max={4000}
              placeholder="Optional"
            />

            {/* Today's Codeforces problems */}
            {todayProblems.filter(p => p.platform === 'codeforces').length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-gray-400 mb-2">Today's Problems:</p>
                <div className="space-y-1">
                  {todayProblems.filter(p => p.platform === 'codeforces').map((p) => (
                    <a
                      key={p._id}
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-300 hover:text-[#1F8ACB] transition-colors"
                    >
                      <span className="truncate flex-1">{p.title}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Gym & Diet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gym */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Gym</h3>
          </div>

          <div className="space-y-4">
            <Checkbox
              checked={currentLog?.gym?.completed || false}
              onChange={(val) => updateCurrentLog('gym.completed', val)}
              label="Workout Completed"
              sublabel="Did you hit the gym today?"
            />

            <Select
              label="Workout Type"
              value={currentLog?.gym?.workoutType || 'none'}
              onChange={(val) => updateCurrentLog('gym.workoutType', val)}
              options={workoutTypes}
            />

            <NumberInput
              label="Duration (minutes)"
              value={currentLog?.gym?.duration}
              onChange={(val) => updateCurrentLog('gym.duration', val)}
              min={0}
              max={300}
            />
          </div>
        </GlassCard>

        {/* Diet */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Apple className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Diet</h3>
          </div>

          <div className="space-y-4">
            <Checkbox
              checked={currentLog?.diet?.cleanDiet || false}
              onChange={(val) => updateCurrentLog('diet.cleanDiet', val)}
              label="Clean Diet"
              sublabel="Stayed on track with nutrition"
            />

            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                label="Calories"
                value={currentLog?.diet?.calories}
                onChange={(val) => updateCurrentLog('diet.calories', val)}
                min={0}
                max={10000}
                placeholder="Optional"
              />

              <NumberInput
                label="Protein (g)"
                value={currentLog?.diet?.protein}
                onChange={(val) => updateCurrentLog('diet.protein', val)}
                min={0}
                max={500}
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Diet Notes
              </label>
              <textarea
                value={currentLog?.diet?.notes || ''}
                onChange={(e) => updateCurrentLog('diet.notes', e.target.value)}
                className="input-field resize-none h-20"
                placeholder="What did you eat today?"
              />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Internship Prep */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Internship Prep</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Checkbox
            checked={currentLog?.internshipPrep?.completed || false}
            onChange={(val) => updateCurrentLog('internshipPrep.completed', val)}
            label="Study Session Completed"
          />

          <NumberInput
            label="Hours Spent"
            value={currentLog?.internshipPrep?.hoursSpent}
            onChange={(val) => updateCurrentLog('internshipPrep.hoursSpent', val)}
            min={0}
            max={24}
            step={0.5}
          />
        </div>
      </GlassCard>

      {/* Notes */}
      <GlassCard>
        <h3 className="text-lg font-semibold text-white mb-4">Daily Notes</h3>
        <textarea
          value={currentLog?.notes || ''}
          onChange={(e) => updateCurrentLog('notes', e.target.value)}
          className="input-field resize-none h-24"
          placeholder="How was your day? Any reflections or achievements to note..."
        />
      </GlassCard>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={handleDelete}
          disabled={currentLog?.isNew}
          className="btn-secondary flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 disabled:opacity-50 w-full sm:w-auto"
        >
          <Trash2 size={20} />
          Delete Log
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          {isSaving ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Save size={20} />
          )}
          Save Progress
        </button>
      </div>

      {/* Problem Modal */}
      <ProblemModal
        isOpen={showProblemModal}
        onClose={() => setShowProblemModal(false)}
        platform={selectedPlatform}
        date={selectedDate}
        onSuccess={handleProblemAdded}
      />

      {/* Streak Animation */}
      <StreakAnimation
        streak={currentStreak}
        show={showStreakAnimation}
        onComplete={() => setShowStreakAnimation(false)}
      />
    </div>
  );
};

export default DailyTracker;
