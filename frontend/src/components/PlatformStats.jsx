import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import GlassCard from './ui/GlassCard';
import LeetCodeHeatmap from './LeetCodeHeatmap';
import { useAuthStore } from '../store/authStore';
import { useAnalyticsStore } from '../store/analyticsStore';

const PlatformStats = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const {
    leetcodeStats,
    codeforcesStats,
    isPlatformLoading,
    platformErrors,
    fetchLeetCodeStats,
    fetchCodeforcesStats,
  } = useAnalyticsStore();

  useEffect(() => {
    fetchLeetCodeStats(user?.leetcodeHandle);
    fetchCodeforcesStats(user?.codeforcesHandle);
  }, [user?.leetcodeHandle, user?.codeforcesHandle, fetchLeetCodeStats, fetchCodeforcesStats]);

  const hasAnyHandle = user?.leetcodeHandle || user?.codeforcesHandle || user?.codechefHandle;

  if (!hasAnyHandle) {
    return (
      <GlassCard 
        onClick={() => navigate('/profile#platform-handles')}
        className="cursor-pointer hover:bg-white/5 transition-colors group"
      >
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Code2 className="w-12 h-12 text-dark-500 mb-3 group-hover:text-neon-green transition-colors" />
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-neon-green transition-colors">
            Connect Your Coding Profiles
          </h3>
          <p className="text-dark-400 text-sm max-w-md group-hover:text-dark-300 transition-colors">
            Add your LeetCode, Codeforces, or CodeChef username in your Profile
            to see your coding stats here. Click to connect.
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
                    onClick={() => fetchLeetCodeStats(user?.leetcodeHandle)}
                    disabled={isPlatformLoading.leetcode}
                    className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors"
                  >
                    <RefreshCw
                      className={`w-4 h-4 text-dark-400 ${
                        isPlatformLoading.leetcode ? 'animate-spin' : ''
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

              {isPlatformLoading.leetcode && !leetcodeStats ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 text-[#FFA116] animate-spin" />
                </div>
              ) : platformErrors.leetcode ? (
                <div className="flex items-center gap-2 text-red-400 text-sm py-4">
                  <AlertCircle className="w-4 h-4" />
                  {platformErrors.leetcode}
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
                    onClick={() => fetchCodeforcesStats(user?.codeforcesHandle)}
                    disabled={isPlatformLoading.codeforces}
                    className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors"
                  >
                    <RefreshCw
                      className={`w-4 h-4 text-dark-400 ${
                        isPlatformLoading.codeforces ? 'animate-spin' : ''
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

              {isPlatformLoading.codeforces && !codeforcesStats ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : platformErrors.codeforces ? (
                <div className="flex items-center gap-2 text-red-400 text-sm py-4">
                  <AlertCircle className="w-4 h-4" />
                  {platformErrors.codeforces}
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

      {/* Activity and Rating History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LeetCode Heatmap */}
        {user?.leetcodeHandle && leetcodeStats?.submissionCalendar && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="h-full">
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

        {/* Rating History */}
        {(leetcodeStats?.ratingHistory?.length > 1 || codeforcesStats?.ratingHistory?.length > 1) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            {/* LeetCode Rating History */}
            {leetcodeStats?.ratingHistory?.length > 1 && (
              <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 rounded-lg bg-[#FFA116]/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#FFA116]" />
                  </div>
                  <h3 className="font-semibold text-white">LeetCode Rating</h3>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={leetcodeStats.ratingHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="contestName" hide />
                      <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['dataMin - 100', 'dataMax + 100']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                        itemStyle={{ color: '#FFA116' }}
                      />
                      <Line type="monotone" dataKey="newRating" stroke="#FFA116" strokeWidth={3} dot={{ fill: '#FFA116', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}

            {/* Codeforces Rating History */}
            {codeforcesStats?.ratingHistory?.length > 1 && (
              <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-white">Codeforces Rating</h3>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={codeforcesStats.ratingHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="contestName" hide />
                      <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['dataMin - 100', 'dataMax + 100']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                        itemStyle={{ color: '#3b82f6' }}
                      />
                      <Line type="monotone" dataKey="newRating" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PlatformStats;
