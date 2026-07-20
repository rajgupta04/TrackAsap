import { useEffect } from 'react';
import {
  Code2,
  Trophy,
  Flame,
  Dumbbell,
  Apple,
  TrendingUp,
  Target,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { useAnalyticsStore } from '../store/analyticsStore';
import { useDailyLogStore } from '../store/dailyLogStore';
import { useAuthStore } from '../store/authStore';
import GlassCard from '../components/ui/GlassCard';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PlatformStats from '../components/PlatformStats';

const Dashboard = () => {
  const { user } = useAuthStore();
  const {
    dashboard,
    problemsTrend,
    weightProgress,
    leetcodeStats,
    codeforcesStats,
    codechefStats,
    isLoading,
    fetchDashboard,
    fetchProblemsTrend,
    fetchWeightProgress,
  } = useAnalyticsStore();
  const { streak, fetchStreak } = useDailyLogStore();

  useEffect(() => {
    fetchDashboard();
    fetchProblemsTrend();
    fetchWeightProgress();
    fetchStreak();
  }, []);

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { totals, weeklyCompletion, dietCompliance, gymCompliance } = dashboard;
  
  // Dynamically calculate aggregate platform totals
  const aggregateTotalProblems = 
    (totals?.totalProblems || 0) + 
    (leetcodeStats?.totalSolved || 0) + 
    (codeforcesStats?.problemsSolved || 0) + 
    (codechefStats?.totalSolved || 0);

  const aggregateContests = 
    (totals?.contestsParticipated || 0) + 
    (codeforcesStats?.contestsParticipated || 0) + 
    (leetcodeStats?.contestsParticipated || 0); // Leetcode API doesn't currently return contests but added for future proofing

  const hasProblemsTrend = (problemsTrend || []).length > 0;
  const hasWeightHistory = (weightProgress || []).length > 0;
  
  // Use external API stats for Platform Breakdown if available, fallback to local trackex totals
  const lcCount = leetcodeStats?.totalSolved || totals?.leetcodeProblems || 0;
  const cfCount = codeforcesStats?.problemsSolved || totals?.codeforcesProblems || 0;
  const ccCount = codechefStats?.totalSolved || totals?.codechefProblems || 0;

  const hasPlatformHistory =
    aggregateTotalProblems > 0 ||
    lcCount > 0 ||
    ccCount > 0 ||
    cfCount > 0;
    
  const hasComplianceHistory = user?.enablePhysique && (
    (totals?.daysLogged || 0) > 0 ||
    (weeklyCompletion || 0) > 0 ||
    (dietCompliance || 0) > 0 ||
    (gymCompliance || 0) > 0
  );
  const chartGridCols = 'lg:grid-cols-2';
  const statsGridCols = 'lg:grid-cols-2';

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Problems"
          value={aggregateTotalProblems}
          subtitle="Across all platforms"
          icon={Code2}
          iconColor="text-neon-green"
          iconBg="bg-neon-green/10"
        />
        <StatCard
          title="Contests"
          value={aggregateContests}
          subtitle="Participated"
          icon={Trophy}
          iconColor="text-yellow-500"
          iconBg="bg-yellow-500/10"
        />
        <StatCard
          title="Current Streak"
          value={`${streak.currentStreak} days`}
          subtitle={`Best: ${streak.longestStreak} days`}
          icon={Flame}
          iconColor="text-orange-500"
          iconBg="bg-orange-500/10"
        />
        <StatCard
          title="Weekly Score"
          value={`${weeklyCompletion}%`}
          subtitle="Last 7 days"
          icon={Zap}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-400/10"
        />
      </div>

      {(hasProblemsTrend || hasWeightHistory) && (
        <div className={`grid grid-cols-1 ${chartGridCols} gap-4 md:gap-6`}>
          {hasProblemsTrend && (
            <GlassCard>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-base md:text-lg font-semibold text-white">Problems Solved</h3>
                <TrendingUp className="w-5 h-5 text-neon-green" />
              </div>
              <div className="h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={problemsTrend}>
                    <defs>
                      <linearGradient id="colorProblems" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#39FF14" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#39FF14" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="dayNumber"
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(val) => `D${val}`}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#39FF14"
                      strokeWidth={2}
                      fill="url(#colorProblems)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}

          {hasWeightHistory && (
            <GlassCard>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-base md:text-lg font-semibold text-white">Weight Progress</h3>
                <Target className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightProgress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="weekNumber"
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(val) => `W${val}`}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#00FFFF"
                      strokeWidth={2}
                      dot={{ fill: '#00FFFF', strokeWidth: 2 }}
                    />
                    {weightProgress[0]?.target && (
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#FF10F0"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      <PlatformStats />

      {(hasPlatformHistory || hasComplianceHistory) && (
        <div className={`grid grid-cols-1 ${statsGridCols} gap-4 md:gap-6`}>
          {hasPlatformHistory && (
            <GlassCard>
              <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">Platform Breakdown</h3>
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
          )}

          {hasComplianceHistory && (
            <GlassCard>
              <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">Compliance</h3>
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Dumbbell className="w-5 h-5 text-purple-400" />
                    <span className="text-dark-300">Gym</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-dark-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-400"
                        style={{ width: `${gymCompliance}%` }}
                      />
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
                      <div
                        className="h-full bg-green-400"
                        style={{ width: `${dietCompliance}%` }}
                      />
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
                      <div
                        className="h-full bg-cyan-400"
                        style={{ width: `${weeklyCompletion}%` }}
                      />
                    </div>
                    <span className="text-sm text-white">{weeklyCompletion}%</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
