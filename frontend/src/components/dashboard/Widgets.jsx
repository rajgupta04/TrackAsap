import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Trophy, Target, TrendingUp, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Flame, Dumbbell, Apple, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import GlassCard from '../ui/GlassCard';
import LeetCodeHeatmap from '../LeetCodeHeatmap';

export const LeetCodeStatsWidget = ({ user, leetcodeStats, isPlatformLoading, fetchLeetCodeStats }) => {
  if (!user?.leetcodeHandle) return null;
  return (
    <GlassCard className="h-full">
      <div className="flex items-center justify-between mb-4 cursor-move drag-handle">
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
          <button onClick={fetchLeetCodeStats} disabled={isPlatformLoading.leetcode} className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors">
            <RefreshCw className={`w-4 h-4 text-dark-400 ${isPlatformLoading.leetcode ? 'animate-spin' : ''}`} />
          </button>
          <a href={`https://leetcode.com/${user.leetcodeHandle}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors">
            <ExternalLink className="w-4 h-4 text-dark-400" />
          </a>
        </div>
      </div>
      {!leetcodeStats ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFA116]"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center py-2">
            <div className="text-3xl font-bold text-[#FFA116]">{leetcodeStats.totalSolved}</div>
            <div className="text-sm text-dark-400">Problems Solved</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-500/10 rounded-xl p-3 text-center">
              <div className="text-lg md:text-xl font-bold text-green-400">{leetcodeStats.easySolved}</div>
              <div className="text-xs text-dark-400">Easy<br/><span className="text-[10px] opacity-50">/{leetcodeStats.totalEasy}</span></div>
            </div>
            <div className="bg-yellow-500/10 rounded-xl p-3 text-center">
              <div className="text-lg md:text-xl font-bold text-yellow-500">{leetcodeStats.mediumSolved}</div>
              <div className="text-xs text-dark-400">Medium<br/><span className="text-[10px] opacity-50">/{leetcodeStats.totalMedium}</span></div>
            </div>
            <div className="bg-red-500/10 rounded-xl p-3 text-center">
              <div className="text-lg md:text-xl font-bold text-red-500">{leetcodeStats.hardSolved}</div>
              <div className="text-xs text-dark-400">Hard<br/><span className="text-[10px] opacity-50">/{leetcodeStats.totalHard}</span></div>
            </div>
          </div>
          <div className="flex items-center justify-around pt-2 border-t border-dark-700/50">
            <div className="text-center">
              <div className="flex items-center gap-1 text-white"><Trophy className="w-4 h-4 text-yellow-500" /><span className="font-semibold">{leetcodeStats.contestsParticipated || 0}</span></div>
              <div className="text-xs text-dark-400">Contests</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-white"><TrendingUp className="w-4 h-4 text-[#FFA116]" /><span className="font-semibold">#{leetcodeStats.ranking?.toLocaleString()}</span></div>
              <div className="text-xs text-dark-400">Ranking</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-white"><Flame className="w-4 h-4 text-orange-500" /><span className="font-semibold">{leetcodeStats.streak || 0}</span></div>
              <div className="text-xs text-dark-400">Streak</div>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export const CodeforcesStatsWidget = ({ user, codeforcesStats, isPlatformLoading, fetchCodeforcesStats }) => {
  if (!user?.codeforcesHandle) return null;
  return (
    <GlassCard className="h-full">
      <div className="flex items-center justify-between mb-4 cursor-move drag-handle">
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
          <button onClick={fetchCodeforcesStats} disabled={isPlatformLoading.codeforces} className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors">
            <RefreshCw className={`w-4 h-4 text-dark-400 ${isPlatformLoading.codeforces ? 'animate-spin' : ''}`} />
          </button>
          <a href={`https://codeforces.com/profile/${user.codeforcesHandle}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors">
            <ExternalLink className="w-4 h-4 text-dark-400" />
          </a>
        </div>
      </div>
      {!codeforcesStats ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1F8ACB]"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center py-2">
            <div className="text-3xl font-bold text-[#1F8ACB]">{codeforcesStats.rating || 'Unrated'}</div>
            <div className="text-sm capitalize text-dark-400">{codeforcesStats.rank || 'Unrated'}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-dark-700/30 rounded-xl p-3 text-center">
              <div className="text-lg md:text-xl font-bold text-white">{codeforcesStats.maxRating}</div>
              <div className="text-xs text-dark-400">Max Rating</div>
            </div>
            <div className="bg-dark-700/30 rounded-xl p-3 text-center">
              <div className="text-lg md:text-xl font-bold text-white">{codeforcesStats.problemsSolved}</div>
              <div className="text-xs text-dark-400">Problems Solved</div>
            </div>
          </div>
          <div className="flex items-center justify-around pt-2 border-t border-dark-700/50">
            <div className="text-center">
              <div className="flex items-center gap-1 text-white"><Trophy className="w-4 h-4 text-yellow-500" /><span className="font-semibold">{codeforcesStats.contestsParticipated}</span></div>
              <div className="text-xs text-dark-400">Contests</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-white"><TrendingUp className="w-4 h-4 text-neon-green" /><span className="font-semibold">{codeforcesStats.contribution >= 0 ? '+' : ''}{codeforcesStats.contribution}</span></div>
              <div className="text-xs text-dark-400">Contribution</div>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export const CodeChefStatsWidget = ({ user }) => {
  if (!user?.codechefHandle) return null;
  return (
    <GlassCard className="h-full">
      <div className="flex items-center justify-between mb-4 cursor-move drag-handle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5B4638]/20 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-[#5B4638]" />
          </div>
          <div>
            <h3 className="font-semibold text-white">CodeChef</h3>
            <p className="text-xs text-dark-400">@{user.codechefHandle}</p>
          </div>
        </div>
        <a href={`https://www.codechef.com/users/${user.codechefHandle}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors">
          <ExternalLink className="w-4 h-4 text-dark-400" />
        </a>
      </div>
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <AlertCircle className="w-8 h-8 text-dark-500 mb-2" />
        <p className="text-sm text-dark-400">CodeChef API not publicly available</p>
        <a href={`https://www.codechef.com/users/${user.codechefHandle}`} target="_blank" rel="noopener noreferrer" className="mt-3 text-sm text-[#5B4638] hover:underline flex items-center gap-1">
          View Profile <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </GlassCard>
  );
};

export const LeetCodeHeatmapWidget = ({ user, leetcodeStats }) => {
  if (!user?.leetcodeHandle || !leetcodeStats?.submissionCalendar) return null;
  return (
    <GlassCard className="h-full">
      <div className="flex items-center gap-3 mb-4 cursor-move drag-handle">
        <div className="w-8 h-8 rounded-lg bg-[#FFA116]/20 flex items-center justify-center">
          <Code2 className="w-4 h-4 text-[#FFA116]" />
        </div>
        <h3 className="font-semibold text-white">LeetCode Activity</h3>
      </div>
      <LeetCodeHeatmap submissionCalendar={leetcodeStats.submissionCalendar} />
    </GlassCard>
  );
};

export const LeetCodeRatingWidget = ({ leetcodeStats }) => {
  if (!leetcodeStats?.ratingHistory || leetcodeStats.ratingHistory.length <= 1) return null;
  return (
    <GlassCard className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4 cursor-move drag-handle">
        <div className="w-8 h-8 rounded-lg bg-[#FFA116]/20 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-[#FFA116]" />
        </div>
        <h3 className="font-semibold text-white">LeetCode Rating</h3>
      </div>
      <div className="flex-1 min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={leetcodeStats.ratingHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="contestName" hide />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['dataMin - 100', 'dataMax + 100']} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} itemStyle={{ color: '#FFA116' }} />
            <Line type="monotone" dataKey="newRating" stroke="#FFA116" strokeWidth={3} dot={{ fill: '#FFA116', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};

export const CodeforcesRatingWidget = ({ codeforcesStats }) => {
  if (!codeforcesStats?.ratingHistory || codeforcesStats.ratingHistory.length <= 1) return null;
  return (
    <GlassCard className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4 cursor-move drag-handle">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-blue-500" />
        </div>
        <h3 className="font-semibold text-white">Codeforces Rating</h3>
      </div>
      <div className="flex-1 min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={codeforcesStats.ratingHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="contestName" hide />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['dataMin - 100', 'dataMax + 100']} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} itemStyle={{ color: '#3b82f6' }} />
            <Line type="monotone" dataKey="newRating" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};

export const ProblemsTrendWidget = ({ problemsTrend }) => (
  <GlassCard className="h-full flex flex-col">
    <div className="flex items-center justify-between mb-4 md:mb-6 cursor-move drag-handle">
      <h3 className="text-base md:text-lg font-semibold text-white">Problems Solved</h3>
      <TrendingUp className="w-5 h-5 text-neon-green" />
    </div>
    <div className="flex-1 min-h-[192px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={problemsTrend}>
          <defs>
            <linearGradient id="colorProblems" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#39FF14" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#39FF14" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="dayNumber" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `D${val}`} />
          <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
          <Area type="monotone" dataKey="cumulative" stroke="#39FF14" strokeWidth={2} fill="url(#colorProblems)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </GlassCard>
);

export const WeightProgressWidget = ({ weightProgress }) => (
  <GlassCard className="h-full flex flex-col">
    <div className="flex items-center justify-between mb-4 md:mb-6">
      <h3 className="text-base md:text-lg font-semibold text-white">Weight Progress</h3>
      <Target className="w-5 h-5 text-cyan-400" />
    </div>
    <div className="flex-1 min-h-[192px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={weightProgress}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="weekNumber" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `W${val}`} />
          <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['auto', 'auto']} />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
          <Line type="monotone" dataKey="weight" stroke="#00FFFF" strokeWidth={2} dot={{ fill: '#00FFFF', strokeWidth: 2 }} />
          {weightProgress[0]?.target && (
            <Line type="monotone" dataKey="target" stroke="#FF10F0" strokeDasharray="5 5" strokeWidth={2} dot={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  </GlassCard>
);

export const PlatformBreakdownWidget = ({ lcCount, ccCount, cfCount }) => (
  <GlassCard className="h-full">
    <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6 cursor-move drag-handle">Platform Breakdown</h3>
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      <div className="text-center p-2 md:p-4 rounded-xl bg-dark-800/30 border border-dark-700/30">
        <div className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 rounded-lg md:rounded-xl bg-[#FFA116]/10 flex items-center justify-center">
          <Code2 className="w-4 h-4 md:w-6 md:h-6 text-[#FFA116]" />
        </div>
        <p className="text-lg md:text-2xl font-bold text-white">{lcCount}</p>
        <p className="text-xs md:text-sm text-dark-400">LeetCode</p>
      </div>
      <div className="text-center p-2 md:p-4 rounded-xl bg-dark-800/30 border border-dark-700/30">
        <div className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 rounded-lg md:rounded-xl bg-[#5B4638]/20 flex items-center justify-center">
          <Code2 className="w-4 h-4 md:w-6 md:h-6 text-[#5B4638]" />
        </div>
        <p className="text-lg md:text-2xl font-bold text-white">{ccCount}</p>
        <p className="text-xs md:text-sm text-dark-400">CodeChef</p>
      </div>
      <div className="text-center p-2 md:p-4 rounded-xl bg-dark-800/30 border border-dark-700/30">
        <div className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 rounded-lg md:rounded-xl bg-[#1F8ACB]/10 flex items-center justify-center">
          <Code2 className="w-4 h-4 md:w-6 md:h-6 text-[#1F8ACB]" />
        </div>
        <p className="text-lg md:text-2xl font-bold text-white">{cfCount}</p>
        <p className="text-xs md:text-sm text-dark-400">Codeforces</p>
      </div>
    </div>
  </GlassCard>
);

export const ComplianceWidget = ({ gymCompliance, dietCompliance, weeklyCompletion }) => (
  <GlassCard className="h-full">
    <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6 cursor-move drag-handle">Compliance</h3>
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Dumbbell className="w-5 h-5 text-purple-400" />
          <span className="text-dark-300">Gym</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-dark-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-400" style={{ width: `${gymCompliance}%` }} />
          </div>
          <span className="text-sm text-white">{gymCompliance}%</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Apple className="w-5 h-5 text-green-400" />
          <span className="text-dark-300">Diet</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-dark-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-400" style={{ width: `${dietCompliance}%` }} />
          </div>
          <span className="text-sm text-white">{dietCompliance}%</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-cyan-400" />
          <span className="text-dark-300">Weekly</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-dark-800 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400" style={{ width: `${weeklyCompletion}%` }} />
          </div>
          <span className="text-sm text-white">{weeklyCompletion}%</span>
        </div>
      </div>
    </div>
  </GlassCard>
);
