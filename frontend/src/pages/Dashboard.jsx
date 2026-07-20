import { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  Code2,
  Trophy,
  Flame,
  Zap,
} from 'lucide-react';
import { useAnalyticsStore } from '../store/analyticsStore';
import { useDailyLogStore } from '../store/dailyLogStore';
import { useAuthStore } from '../store/authStore';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  LeetCodeStatsWidget,
  CodeforcesStatsWidget,
  CodeChefStatsWidget,
  LeetCodeHeatmapWidget,
  LeetCodeRatingWidget,
  CodeforcesRatingWidget,
  ProblemsTrendWidget,
  WeightProgressWidget,
  PlatformBreakdownWidget,
  ComplianceWidget
} from '../components/dashboard/Widgets';

const ResponsiveGridLayout = WidthProvider(Responsive);

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
    isPlatformLoading,
    fetchDashboard,
    fetchProblemsTrend,
    fetchWeightProgress,
    fetchLeetCodeStats,
    fetchCodeforcesStats
  } = useAnalyticsStore();
  
  const { streak, fetchStreak } = useDailyLogStore();

  useEffect(() => {
    fetchDashboard();
    fetchProblemsTrend();
    fetchWeightProgress();
    fetchStreak();
    
    // Attempt fetching platform stats if handles exist
    if (user?.leetcodeHandle && !leetcodeStats) fetchLeetCodeStats(user.leetcodeHandle);
    if (user?.codeforcesHandle && !codeforcesStats) fetchCodeforcesStats(user.codeforcesHandle);
    // codechefStats fetched if supported
  }, []);

  // Retrieve layout from localStorage or fallback to default
  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem('dashboard-layout');
    if (saved) return JSON.parse(saved);
    return [
      { i: 'problemsTrend', x: 0, y: 0, w: 6, h: 10 },
      { i: 'weightProgress', x: 6, y: 0, w: 6, h: 10 },
      { i: 'leetcodeStats', x: 0, y: 10, w: 6, h: 8 },
      { i: 'codeforcesStats', x: 6, y: 10, w: 6, h: 8 },
      { i: 'codechefStats', x: 0, y: 18, w: 6, h: 8 },
      { i: 'leetcodeHeatmap', x: 0, y: 26, w: 12, h: 8 },
      { i: 'leetcodeRating', x: 0, y: 34, w: 6, h: 8 },
      { i: 'codeforcesRating', x: 6, y: 34, w: 6, h: 8 },
      { i: 'platformBreakdown', x: 0, y: 42, w: 6, h: 6 },
      { i: 'compliance', x: 6, y: 42, w: 6, h: 6 }
    ];
  });

  const onLayoutChange = (newLayout) => {
    setLayout(newLayout);
    localStorage.setItem('dashboard-layout', JSON.stringify(newLayout));
  };

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { totals, weeklyCompletion, dietCompliance, gymCompliance } = dashboard;
  
  const aggregateTotalProblems = 
    (totals?.totalProblems || 0) + 
    (leetcodeStats?.totalSolved || 0) + 
    (codeforcesStats?.problemsSolved || 0) + 
    (codechefStats?.totalSolved || 0);

  const aggregateContests = 
    (totals?.contestsParticipated || 0) + 
    (codeforcesStats?.contestsParticipated || 0) + 
    (leetcodeStats?.contestsParticipated || 0); 

  const hasProblemsTrend = (problemsTrend || []).length > 0;
  const hasWeightHistory = (weightProgress || []).length > 0;
  
  const lcCount = leetcodeStats?.totalSolved || totals?.leetcodeProblems || 0;
  const cfCount = codeforcesStats?.problemsSolved || totals?.codeforcesProblems || 0;
  const ccCount = codechefStats?.totalSolved || totals?.codechefProblems || 0;

  const hasPlatformHistory = aggregateTotalProblems > 0 || lcCount > 0 || ccCount > 0 || cfCount > 0;
  const hasComplianceHistory = user?.enablePhysique && (
    (totals?.daysLogged || 0) > 0 ||
    (weeklyCompletion || 0) > 0 ||
    (dietCompliance || 0) > 0 ||
    (gymCompliance || 0) > 0
  );

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 pb-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Problems" value={aggregateTotalProblems} subtitle="Across all platforms" icon={Code2} iconColor="text-neon-green" iconBg="bg-neon-green/10" />
        <StatCard title="Contests" value={aggregateContests} subtitle="Participated" icon={Trophy} iconColor="text-yellow-500" iconBg="bg-yellow-500/10" />
        <StatCard title="Current Streak" value={`${streak.currentStreak} days`} subtitle={`Best: ${streak.longestStreak} days`} icon={Flame} iconColor="text-orange-500" iconBg="bg-orange-500/10" />
        <StatCard title="Weekly Score" value={`${weeklyCompletion}%`} subtitle="Last 7 days" icon={Zap} iconColor="text-cyan-400" iconBg="bg-cyan-400/10" />
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1024, md: 768, sm: 640, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        onLayoutChange={onLayoutChange}
        isDraggable={true}
        isResizable={true}
        draggableHandle=".drag-handle"
        margin={[16, 16]}
      >
        {hasProblemsTrend && (
          <div key="problemsTrend"><ProblemsTrendWidget problemsTrend={problemsTrend} /></div>
        )}
        {hasWeightHistory && (
          <div key="weightProgress"><WeightProgressWidget weightProgress={weightProgress} /></div>
        )}
        {user?.leetcodeHandle && (
          <div key="leetcodeStats">
            <LeetCodeStatsWidget user={user} leetcodeStats={leetcodeStats} isPlatformLoading={isPlatformLoading} fetchLeetCodeStats={fetchLeetCodeStats} />
          </div>
        )}
        {user?.codeforcesHandle && (
          <div key="codeforcesStats">
            <CodeforcesStatsWidget user={user} codeforcesStats={codeforcesStats} isPlatformLoading={isPlatformLoading} fetchCodeforcesStats={fetchCodeforcesStats} />
          </div>
        )}
        {user?.codechefHandle && (
          <div key="codechefStats">
            <CodeChefStatsWidget user={user} />
          </div>
        )}
        {user?.leetcodeHandle && leetcodeStats?.submissionCalendar && (
          <div key="leetcodeHeatmap">
            <LeetCodeHeatmapWidget user={user} leetcodeStats={leetcodeStats} />
          </div>
        )}
        {leetcodeStats?.ratingHistory?.length > 1 && (
          <div key="leetcodeRating">
            <LeetCodeRatingWidget leetcodeStats={leetcodeStats} />
          </div>
        )}
        {codeforcesStats?.ratingHistory?.length > 1 && (
          <div key="codeforcesRating">
            <CodeforcesRatingWidget codeforcesStats={codeforcesStats} />
          </div>
        )}
        {hasPlatformHistory && (
          <div key="platformBreakdown">
            <PlatformBreakdownWidget lcCount={lcCount} ccCount={ccCount} cfCount={cfCount} />
          </div>
        )}
        {hasComplianceHistory && (
          <div key="compliance">
            <ComplianceWidget gymCompliance={gymCompliance} dietCompliance={dietCompliance} weeklyCompletion={weeklyCompletion} />
          </div>
        )}
      </ResponsiveGridLayout>
    </div>
  );
};

export default Dashboard;
