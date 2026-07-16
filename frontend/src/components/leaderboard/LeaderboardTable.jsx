import { motion } from 'framer-motion';
import { Flame, Medal, GraduationCap } from 'lucide-react';
import { useLeaderboardStore } from '../../store/leaderboardStore';

const LeaderboardTable = () => {
  const { leaderboardData, activeTab, currentPage } = useLeaderboardStore();

  // If we're on page 1, skip the first 3 since they are in the Podium.
  const startIndex = currentPage === 1 ? 3 : 0;
  const tableData = leaderboardData.slice(startIndex);
  const baseRank = currentPage === 1 ? 4 : ((currentPage - 1) * 50) + 1;

  if (tableData.length === 0 && currentPage === 1) {
    return (
      <div className="text-center py-12 text-dark-400">
        No competitors found for this category.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-dark-700/50 text-dark-400 text-sm">
            <th className="py-4 px-4 font-semibold w-16 text-center">Rank</th>
            <th className="py-4 px-4 font-semibold">Competitor</th>
            <th className="py-4 px-4 font-semibold hidden md:table-cell">College</th>
            <th className="py-4 px-4 font-semibold text-center">Max Streak</th>
            <th className="py-4 px-4 font-semibold text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((item, index) => {
            const currentRank = baseRank + index;
            const score = activeTab === 'global' ? item.globalScore : activeTab === 'weekly' ? item.weeklyScore : item.monthlyScore;
            
            return (
              <motion.tr
                key={item.user._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors group"
              >
                {/* Rank */}
                <td className="py-4 px-4 text-center">
                  <span className="text-dark-400 font-bold group-hover:text-white transition-colors">
                    #{currentRank}
                  </span>
                </td>

                {/* User */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user.name}&backgroundColor=transparent`}
                      alt={item.user.name}
                      className="w-10 h-10 rounded-full bg-dark-700 border border-dark-600"
                    />
                    <div>
                      <p className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                        {item.user.name}
                      </p>
                      {item.user.codeforcesHandle && (
                        <p className="text-xs text-dark-400">
                          CF: {item.user.codeforcesHandle}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* College */}
                <td className="py-4 px-4 hidden md:table-cell">
                  <div className="flex items-center gap-2 text-dark-300 text-sm">
                    <GraduationCap className="w-4 h-4 text-dark-500" />
                    {item.user.college || item.college || 'N/A'}
                  </div>
                </td>

                {/* Max Streak */}
                <td className="py-4 px-4 text-center">
                  <div className="inline-flex items-center gap-1 bg-dark-800 px-2 py-1 rounded border border-dark-700 text-sm">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold text-orange-400">
                      {item.statsBreakdown?.currentStreak || 0}
                    </span>
                  </div>
                </td>

                {/* Score */}
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1 font-bold text-primary-400">
                    {score.toLocaleString()}
                    <Medal className="w-4 h-4 text-primary-500/70 hidden sm:block" />
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
