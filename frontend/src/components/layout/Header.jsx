import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Trophy, Target, RefreshCw } from 'lucide-react';
import { useDailyLogStore } from '../../store/dailyLogStore';
import { useAuthStore } from '../../store/authStore';

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
  const { streak, fetchStreak } = useDailyLogStore();
  const { user } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        <div className="ml-12 md:ml-0">
          <motion.h1
            key={pageTitle}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl sm:text-2xl font-bold text-white"
          >
            {pageTitle}
          </motion.h1>
          <p className="text-xs sm:text-sm text-dark-400">
            Day {currentDay} of 75 • {75 - currentDay} days remaining
          </p>
        </div>

        {/* Stats */}
        <div className="hidden lg:flex items-center gap-3 xl:gap-4">
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
            onClick={handleRefreshStats}
            className="flex items-center gap-3 px-4 py-2 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:bg-dark-700/50 hover:border-dark-600/50 transition-all cursor-pointer group"
          >
            <Flame size={18} className={`text-orange-500 ${isRefreshing ? 'animate-pulse' : ''}`} />
            <div className="text-left">
              <p className="text-xs text-dark-400 flex items-center gap-1">
                Streak
                <RefreshCw size={10} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isRefreshing ? 'animate-spin opacity-100' : ''}`} />
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

        {/* Compact stats for tablet - also clickable */}
        <div className="hidden md:flex lg:hidden items-center gap-2">
          <button
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800/50 border border-dark-700/50 hover:bg-dark-700/50 transition-all"
          >
            <Target size={16} className="text-neon-green" />
            <span className="text-sm font-semibold text-white">{progress}%</span>
          </button>
          <button
            onClick={handleRefreshStats}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800/50 border border-dark-700/50 hover:bg-dark-700/50 transition-all"
          >
            <Flame size={16} className={`text-orange-500 ${isRefreshing ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-semibold text-white">{streak?.currentStreak || 0}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
