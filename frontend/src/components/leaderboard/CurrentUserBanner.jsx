import { motion, AnimatePresence } from 'framer-motion';
import { useLeaderboardStore } from '../../store/leaderboardStore';
import { ArrowUpRight } from 'lucide-react';

const CurrentUserBanner = () => {
  const { currentUserProfile, currentUserRanks, leaderboardData, activeTab, currentPage } = useLeaderboardStore();

  if (!currentUserProfile) return null;

  // Check if current user is currently visible in the table/podium on this page
  // If they are, we don't necessarily need to show the sticky banner, but it's often good UI to show it anyway
  // For this implementation, we will always show it if they exist, anchored to the bottom.
  const rank = currentUserRanks[activeTab] || 0;
  const score = activeTab === 'global' ? currentUserProfile.globalScore : activeTab === 'weekly' ? currentUserProfile.weeklyScore : currentUserProfile.monthlyScore;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 md:left-64 bg-dark-800/90 backdrop-blur-md border-t border-primary-500/30 p-4 shadow-[0_-10px_40px_rgba(34,197,94,0.1)] z-50"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-primary-500 bg-dark-700 overflow-hidden">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserProfile.user?.name || 'You'}&backgroundColor=transparent`}
                  alt="You"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-primary-400">
                You
              </div>
            </div>
            
            <div>
              <p className="font-bold text-white">My Ranking</p>
              <div className="flex items-center gap-2 text-sm text-dark-300">
                <span>Top {Math.max(1, Math.ceil((rank / 1000) * 100))}%</span>
                <span className="w-1 h-1 rounded-full bg-dark-500" />
                <span className="text-primary-400">{score.toLocaleString()} pts</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs text-dark-400 uppercase tracking-wider font-semibold mb-1">
              Current Rank
            </span>
            <div className="flex items-center gap-1 text-2xl font-black text-white">
              <span className="text-primary-500">#</span>
              {rank}
              <ArrowUpRight className="w-5 h-5 text-primary-500 ml-1" />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CurrentUserBanner;
