import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, BarChart3, PieChartIcon, Grid3X3 } from 'lucide-react';
import { useAnalyticsStore } from '../store/analyticsStore';
import GlassCard from '../components/ui/GlassCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Analytics = () => {
  const {
    problemsTrend,
    platformDistribution,
    difficultyBreakdown,
    heatmapData,
    codeforcesRating,
    isLoading,
    fetchAll,
  } = useAnalyticsStore();

  useEffect(() => {
    fetchAll();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-3">
          <p className="text-white font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Problems Trend */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-neon-green" />
            <h3 className="text-lg md:text-xl font-semibold text-white">
              Problems Solved Over Time
            </h3>
          </div>
        </div>

        <div className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={problemsTrend}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#39FF14" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#39FF14" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="dayNumber"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(val) => `Day ${val}`}
              />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Total Problems"
                stroke="#39FF14"
                strokeWidth={2}
                fill="url(#colorTotal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Platform Distribution */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
            <h3 className="text-lg md:text-xl font-semibold text-white">
              Platform Distribution
            </h3>
          </div>

          <div className="h-56 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8' }} />
                <YAxis
                  dataKey="platform"
                  type="category"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8' }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="problems" radius={[0, 8, 8, 0]}>
                  {platformDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Difficulty Breakdown */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <PieChartIcon className="w-5 h-5 md:w-6 md:h-6 text-pink-400" />
            <h3 className="text-lg md:text-xl font-semibold text-white">
              Difficulty Breakdown
            </h3>
          </div>

          <div className="h-56 md:h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  label={({ difficulty, count }) => `${difficulty}: ${count}`}
                  labelLine={false}
                >
                  {difficultyBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            {difficultyBreakdown.map((entry) => (
              <div key={entry.difficulty} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-dark-400 text-sm">{entry.difficulty}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Codeforces Rating */}
      {codeforcesRating.length > 0 && (
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">
              Codeforces Rating History
            </h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={codeforcesRating}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="dayNumber"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(val) => `Day ${val}`}
                />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="rating"
                  name="Rating"
                  stroke="#1F8ACB"
                  strokeWidth={2}
                  dot={{ fill: '#1F8ACB', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {/* Activity Heatmap */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <Grid3X3 className="w-6 h-6 text-neon-green" />
          <h3 className="text-xl font-semibold text-white">
            Daily Activity Heatmap
          </h3>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-15 gap-1.5">
          {heatmapData.map((day, index) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              className={`
                aspect-square rounded-md cursor-pointer
                ${
                  day.level === 4
                    ? 'bg-neon-green'
                    : day.level === 3
                    ? 'bg-neon-green/70'
                    : day.level === 2
                    ? 'bg-neon-green/50'
                    : day.level === 1
                    ? 'bg-neon-green/30'
                    : 'bg-dark-700'
                }
              `}
              title={`${day.date}: ${day.value}%`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <span className="text-dark-400 text-sm">Less</span>
          <div className="w-3 h-3 rounded bg-dark-700" />
          <div className="w-3 h-3 rounded bg-neon-green/30" />
          <div className="w-3 h-3 rounded bg-neon-green/50" />
          <div className="w-3 h-3 rounded bg-neon-green/70" />
          <div className="w-3 h-3 rounded bg-neon-green" />
          <span className="text-dark-400 text-sm">More</span>
        </div>
      </GlassCard>
    </div>
  );
};

export default Analytics;
