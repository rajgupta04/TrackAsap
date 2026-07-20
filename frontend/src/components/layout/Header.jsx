import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Trophy, Target, RefreshCw, X, Info, Sparkles, Timer } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { useTimerStore } from '../../store/timerStore';
import StreakModal from './StreakModal';
import StopwatchModal from './StopwatchModal';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/daily-tracker': 'Daily Tracker',
  '/analytics': 'Analytics',
  '/physique': 'Physique Tracker',
  '/profile': 'Profile',
  '/sheets': 'Sheets & Roadmaps',
  '/problems': 'My Problems',
};

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { streak, fetchStreak } = useTaskStore();
  const { user } = useAuthStore();
  const { isRunning, getCurrentTimeMs } = useTimerStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showStopwatchModal, setShowStopwatchModal] = useState(false);
  const [headerTimeMs, setHeaderTimeMs] = useState(0);

  // Sync timer for header display
  useEffect(() => {
    let intervalId;
    if (isRunning) {
      setHeaderTimeMs(getCurrentTimeMs());
      intervalId = setInterval(() => {
        setHeaderTimeMs(getCurrentTimeMs());
      }, 1000); // 1-second tick is enough for header
    } else {
      setHeaderTimeMs(getCurrentTimeMs());
    }
    return () => clearInterval(intervalId);
  }, [isRunning, getCurrentTimeMs]);

  const formatHeaderTime = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const quotes = [
    "Consistency is key, boss! Roz 2 task or 1 solid problem solve karo!",
    "Streak todna paap hai! Keep grinding!",
    "Aag laga denge! Maintain the streak!",
    "Rukna nahi hai! Keep rocking!",
    "Roz thoda thoda! Drop by drop makes an ocean!",
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  // Fetch streak on mount and when location changes (user might have saved a log)
  useEffect(() => {
    fetchStreak();
  }, [location.pathname]);

  const handleRefreshStats = async () => {
    setIsRefreshing(true);
    await fetchStreak();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const pageTitle = pageTitles[location.pathname] || 'Dashboard';

  // Calculate current day
  const startDate = user?.startDate ? new Date(user.startDate) : new Date();
  const today = new Date();
  const currentDay = Math.min(
    75,
    Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1
  );
  const progress = Math.round((currentDay / 75) * 100);

  return (
    <header className="sticky top-0 z-30 bg-dark-950/50 backdrop-blur-xl border-b border-dark-800/50">
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4">
        {/* Page Title */}
        <div>
          <motion.h1
            key={pageTitle}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none"
          >
            {pageTitle}
          </motion.h1>
          <p className="text-[11px] sm:text-xs md:text-sm text-dark-400">
            Day {currentDay} of 75 • {75 - currentDay} days remaining
          </p>
        </div>

        {/* Stats */}
        <div className="hidden lg:flex items-center gap-3 relative">
          <button
            onClick={() => setShowStopwatchModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all cursor-pointer group ${
              isRunning 
                ? 'bg-purple-500/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                : 'bg-dark-800/50 border-dark-700/50 hover:bg-dark-700/50 hover:border-dark-600/50'
            }`}
          >
            <Timer size={18} className={`text-purple-400 ${isRunning ? 'animate-pulse' : 'group-hover:animate-pulse'}`} />
            {isRunning && (
              <span className="text-sm font-bold text-purple-300 font-mono tracking-wider tabular-nums">
                {formatHeaderTime(headerTimeMs)}
              </span>
            )}
          </button>

          {/* Progress - clickable to go to analytics */}
          <button
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-3 px-4 py-2 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:bg-dark-700/50 hover:border-dark-600/50 transition-all cursor-pointer"
          >
            <Target size={18} className="text-neon-green" />
            <div className="text-left">
              <p className="text-xs text-dark-400">Progress</p>
              <p className="text-sm font-semibold text-white">{progress}%</p>
            </div>
            <div className="w-16 h-2 rounded-full bg-dark-700 overflow-hidden">
              <motion.div
                key={progress}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-neon-green to-emerald-400"
              />
            </div>
          </button>

          {/* Current Streak - clickable to refresh */}
          <button
            onClick={() => setShowStreakModal(true)}
            className="flex items-center gap-3 px-4 py-2 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:bg-dark-700/50 hover:border-dark-600/50 transition-all cursor-pointer group"
          >
            <Flame size={18} className={`text-orange-500 ${isRefreshing ? 'animate-pulse' : ''}`} />
            <div className="text-left">
              <p className="text-xs text-dark-400 flex items-center gap-1">
                Streak
              </p>
              <p className="text-sm font-semibold text-white">
                {streak?.currentStreak || 0} days
              </p>
            </div>
          </button>

          {/* Best Streak - clickable to go to daily tracker */}
          <button
            onClick={() => navigate('/daily-tracker')}
            className="flex items-center gap-3 px-4 py-2 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:bg-dark-700/50 hover:border-dark-600/50 transition-all cursor-pointer"
          >
            <Trophy size={18} className="text-yellow-500" />
            <div className="text-left">
              <p className="text-xs text-dark-400">Best</p>
              <p className="text-sm font-semibold text-white">
                {streak?.longestStreak || 0} days
              </p>
            </div>
          </button>
        </div>

        {/* Compact stats for mobile/tablet - also clickable */}
        <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 pr-12 md:pr-0">
          <button
            onClick={() => setShowStopwatchModal(true)}
            className={`flex items-center justify-center p-1.5 sm:p-2 rounded-lg border transition-all gap-1.5 ${
              isRunning 
                ? 'bg-purple-500/20 border-purple-500/50' 
                : 'bg-dark-800/80 border-dark-700/50 hover:bg-dark-700/50'
            }`}
          >
            <Timer size={16} className={`text-purple-400 ${isRunning ? 'animate-pulse' : ''}`} />
            {isRunning && (
              <span className="text-xs font-bold text-purple-300 font-mono tracking-wider tabular-nums">
                {formatHeaderTime(headerTimeMs)}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/analytics')}
            title="Analytics Progress"
            className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-dark-800/80 border border-dark-700/50 hover:bg-dark-700/50 transition-all"
          >
            <Target size={14} className="text-neon-green" />
            <span className="text-xs sm:text-sm font-semibold text-white">{progress}%</span>
          </button>
          <button
            onClick={() => setShowStreakModal(true)}
            title="View Streak Info"
            className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-dark-800/80 border border-dark-700/50 hover:bg-dark-700/50 transition-all"
          >
            <Flame size={14} className={`text-orange-500 ${isRefreshing ? 'animate-pulse' : ''}`} />
            <span className="text-xs sm:text-sm font-semibold text-white">{streak?.currentStreak || 0}</span>
          </button>
        </div>
      </div>

      <StreakModal
        isOpen={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        streak={streak}
        onRefresh={handleRefreshStats}
        isRefreshing={isRefreshing}
      />

      <StopwatchModal
        isOpen={showStopwatchModal}
        onClose={() => setShowStopwatchModal(false)}
      />
    </header>
  );
};

export default Header;
