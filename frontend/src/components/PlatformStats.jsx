import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Code2,
  Trophy,
  Target,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import GlassCard from './ui/GlassCard';
import LeetCodeHeatmap from './LeetCodeHeatmap';
import { getLeetCodeStats, getCodeforcesStats } from '../services/platformStatsService';
import { useAuthStore } from '../store/authStore';

const PlatformStats = () => {
  const { user } = useAuthStore();
  const [leetcodeStats, setLeetcodeStats] = useState(null);
  const [codeforcesStats, setCodeforcesStats] = useState(null);
  const [loading, setLoading] = useState({
    leetcode: false,
    codeforces: false,
  });
  const [errors, setErrors] = useState({
    leetcode: null,
    codeforces: null,
  });

  const fetchLeetCodeStats = async () => {
    if (!user?.leetcodeHandle) return;

    setLoading((prev) => ({ ...prev, leetcode: true }));
    setErrors((prev) => ({ ...prev, leetcode: null }));

    try {
      const data = await getLeetCodeStats(user.leetcodeHandle);
      if (data.success) {
        setLeetcodeStats(data.data);
      } else {
        setErrors((prev) => ({ ...prev, leetcode: data.error }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        leetcode: 'Failed to fetch LeetCode stats',
      }));
    } finally {
      setLoading((prev) => ({ ...prev, leetcode: false }));
    }
  };

  const fetchCodeforcesStats = async () => {
    if (!user?.codeforcesHandle) return;

    setLoading((prev) => ({ ...prev, codeforces: true }));
    setErrors((prev) => ({ ...prev, codeforces: null }));

    try {
      const data = await getCodeforcesStats(user.codeforcesHandle);
      if (data.success) {
        setCodeforcesStats(data.data);
      } else {
        setErrors((prev) => ({ ...prev, codeforces: data.error }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        codeforces: 'Failed to fetch Codeforces stats',
      }));
    } finally {
      setLoading((prev) => ({ ...prev, codeforces: false }));
    }
  };

  useEffect(() => {
    fetchLeetCodeStats();
    fetchCodeforcesStats();
  }, [user?.leetcodeHandle, user?.codeforcesHandle]);

  const hasAnyHandle = user?.leetcodeHandle || user?.codeforcesHandle || user?.codechefHandle;

  if (!hasAnyHandle) {
    return (
      <GlassCard>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Code2 className="w-12 h-12 text-dark-500 mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Connect Your Coding Profiles
          </h3>
          <p className="text-dark-400 text-sm max-w-md">
            Add your LeetCode, Codeforces, or CodeChef username in your Profile
            to see your coding stats here.
          </p>
        </div>
      </GlassCard>
    );
  }

  const getRankColor = (rank) => {
    if (!rank) return 'text-gray-400';
    const r = rank.toLowerCase();
    if (r.includes('grandmaster') || r.includes('legendary')) return 'text-red-500';
    if (r.includes('master') || r.includes('international')) return 'text-orange-500';
    if (r.includes('candidate') || r.includes('expert')) return 'text-violet-500';
    if (r.includes('specialist')) return 'text-cyan-500';
    if (r.includes('pupil')) return 'text-green-500';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-neon-green" />
          Platform Stats
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LeetCode Stats */}
        {user?.leetcodeHandle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFA116]/20 flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-[#FFA116]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">LeetCode</h3>
                    <p className="text-xs text-dark-400">@{user.leetcodeHandle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchLeetCodeStats}
                    disabled={loading.leetcode}
                    className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors"
                  >
                    <RefreshCw
                      className={`w-4 h-4 text-dark-400 ${
                        loading.leetcode ? 'animate-spin' : ''
                      }`}
                    />
                  </button>
                  <a
                    href={`https://leetcode.com/u/${user.leetcodeHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-dark-400" />
                  </a>
                </div>
              </div>

              {loading.leetcode && !leetcodeStats ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 text-[#FFA116] animate-spin" />
                </div>
              ) : errors.leetcode ? (
                <div className="flex items-center gap-2 text-red-400 text-sm py-4">
                  <AlertCircle className="w-4 h-4" />
                  {errors.leetcode}
                </div>
              ) : leetcodeStats ? (
                <div className="space-y-4">
                  {/* Total Solved */}
                  <div className="text-center py-2">
                    <div className="text-3xl md:text-4xl font-bold text-[#FFA116]">
                      {leetcodeStats.totalSolved}
                    </div>
                    <div className="text-xs text-dark-400">Problems Solved</div>
                  </div>

                  {/* Difficulty Breakdown */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-green-500/10 rounded-xl p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-green-400">
                        {leetcodeStats.easySolved}
                      </div>
                      <div className="text-xs text-dark-400">Easy</div>
                      <div className="text-xs text-dark-500">
                        /{leetcodeStats.totalEasy}
                      </div>
                    </div>
                    <div className="bg-yellow-500/10 rounded-xl p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-yellow-400">
                        {leetcodeStats.mediumSolved}
                      </div>
                      <div className="text-xs text-dark-400">Medium</div>
                      <div className="text-xs text-dark-500">
                        /{leetcodeStats.totalMedium}
                      </div>
                    </div>
                    <div className="bg-red-500/10 rounded-xl p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-red-400">
                        {leetcodeStats.hardSolved}
                      </div>
                      <div className="text-xs text-dark-400">Hard</div>
                      <div className="text-xs text-dark-500">
                        /{leetcodeStats.totalHard}
                      </div>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  <div className="flex items-center justify-around pt-2 border-t border-dark-700/50">
                    {leetcodeStats.ranking && (
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-white">
                          <TrendingUp className="w-4 h-4 text-neon-green" />
                          <span className="font-semibold">
                            #{leetcodeStats.ranking.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-dark-400">Ranking</div>
                      </div>
                    )}
                    {leetcodeStats.streak > 0 && (
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-white">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="font-semibold">{leetcodeStats.streak}</span>
                        </div>
                        <div className="text-xs text-dark-400">Streak</div>
                      </div>
                    )}
                    {leetcodeStats.totalActiveDays > 0 && (
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-white">
                          <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                          <span className="font-semibold">
                            {leetcodeStats.totalActiveDays}
                          </span>
                        </div>
                        <div className="text-xs text-dark-400">Active Days</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </GlassCard>
          </motion.div>
        )}

        {/* Codeforces Stats */}
        {user?.codeforcesHandle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1F8ACB]/20 flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-[#1F8ACB]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Codeforces</h3>
                    <p className="text-xs text-dark-400">@{user.codeforcesHandle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchCodeforcesStats}
                    disabled={loading.codeforces}
                    className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors"
                  >
                    <RefreshCw
                      className={`w-4 h-4 text-dark-400 ${
                        loading.codeforces ? 'animate-spin' : ''
                      }`}
                    />
                  </button>
                  <a
                    href={`https://codeforces.com/profile/${user.codeforcesHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-dark-400" />
                  </a>
                </div>
              </div>

              {loading.codeforces && !codeforcesStats ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 text-[#1F8ACB] animate-spin" />
                </div>
              ) : errors.codeforces ? (
                <div className="flex items-center gap-2 text-red-400 text-sm py-4">
                  <AlertCircle className="w-4 h-4" />
                  {errors.codeforces}
                </div>
              ) : codeforcesStats ? (
                <div className="space-y-4">
                  {/* Rating */}
                  <div className="text-center py-2">
                    <div className="text-3xl md:text-4xl font-bold text-[#1F8ACB]">
                      {codeforcesStats.rating || 'Unrated'}
                    </div>
                    <div className={`text-sm font-medium capitalize ${getRankColor(codeforcesStats.rank)}`}>
                      {codeforcesStats.rank}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-dark-700/30 rounded-xl p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-white">
                        {codeforcesStats.maxRating}
                      </div>
                      <div className="text-xs text-dark-400">Max Rating</div>
                      <div className={`text-xs capitalize ${getRankColor(codeforcesStats.maxRank)}`}>
                        {codeforcesStats.maxRank}
                      </div>
                    </div>
                    <div className="bg-dark-700/30 rounded-xl p-3 text-center">
                      <div className="text-lg md:text-xl font-bold text-white">
                        {codeforcesStats.problemsSolved}
                      </div>
                      <div className="text-xs text-dark-400">Problems Solved</div>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  <div className="flex items-center justify-around pt-2 border-t border-dark-700/50">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-white">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold">
                          {codeforcesStats.contestsParticipated}
                        </span>
                      </div>
                      <div className="text-xs text-dark-400">Contests</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-white">
                        <TrendingUp className="w-4 h-4 text-neon-green" />
                        <span className="font-semibold">
                          {codeforcesStats.contribution >= 0 ? '+' : ''}
                          {codeforcesStats.contribution}
                        </span>
                      </div>
                      <div className="text-xs text-dark-400">Contribution</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </GlassCard>
          </motion.div>
        )}

        {/* CodeChef Stats Placeholder */}
        {user?.codechefHandle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#5B4638]/20 flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-[#5B4638]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">CodeChef</h3>
                    <p className="text-xs text-dark-400">@{user.codechefHandle}</p>
                  </div>
                </div>
                <a
                  href={`https://www.codechef.com/users/${user.codechefHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-dark-400" />
                </a>
              </div>

              <div className="flex flex-col items-center justify-center py-6 text-center">
                <AlertCircle className="w-8 h-8 text-dark-500 mb-2" />
                <p className="text-sm text-dark-400">
                  CodeChef API not publicly available
                </p>
                <a
                  href={`https://www.codechef.com/users/${user.codechefHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-sm text-[#5B4638] hover:underline flex items-center gap-1"
                >
                  View Profile <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>

      {/* Full-width LeetCode Heatmap */}
      {user?.leetcodeHandle && leetcodeStats?.submissionCalendar && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#FFA116]/20 flex items-center justify-center">
                <Code2 className="w-4 h-4 text-[#FFA116]" />
              </div>
              <h3 className="font-semibold text-white">LeetCode Activity</h3>
            </div>
            <LeetCodeHeatmap submissionCalendar={leetcodeStats.submissionCalendar} />
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
};

export default PlatformStats;
