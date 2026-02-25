import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Scale,
  TrendingDown,
  TrendingUp,
  Target,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { usePhysiqueStore } from '../store/physiqueStore';
import { useAuthStore } from '../store/authStore';
import GlassCard from '../components/ui/GlassCard';
import StatCard from '../components/ui/StatCard';
import NumberInput from '../components/ui/NumberInput';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ProgressRing from '../components/ui/ProgressRing';

const PhysiqueTracker = () => {
  const { user, updateUser } = useAuthStore();
  const { logs, progress, isLoading, fetchProgress, fetchAll, addLog, deleteLog } = usePhysiqueStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newLog, setNewLog] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: '',
    bodyFat: '',
    notes: '',
  });
  const [targetWeight, setTargetWeight] = useState(user?.targetWeight || '');

  useEffect(() => {
    fetchProgress();
    fetchAll();
  }, []);

  const handleAddLog = async () => {
    if (!newLog.weight) {
      toast.error('Weight is required');
      return;
    }

    const result = await addLog({
      ...newLog,
      weight: Number(newLog.weight),
      bodyFat: newLog.bodyFat ? Number(newLog.bodyFat) : null,
    });

    if (result.success) {
      toast.success('Weight logged!');
      setNewLog({
        date: format(new Date(), 'yyyy-MM-dd'),
        weight: '',
        bodyFat: '',
        notes: '',
      });
      setShowAddForm(false);
    } else {
      toast.error('Failed to add log');
    }
  };

  const handleDeleteLog = async (id) => {
    if (confirm('Delete this weight entry?')) {
      const result = await deleteLog(id);
      if (result.success) {
        toast.success('Entry deleted');
      }
    }
  };

  const handleUpdateTarget = async () => {
    if (!targetWeight) return;
    const result = await updateUser({ targetWeight: Number(targetWeight) });
    if (result.success) {
      toast.success('Target weight updated!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const weightChange = progress?.totalChange || 0;
  const isLosingWeight = weightChange < 0;

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Current Weight"
          value={progress?.currentWeight ? `${progress.currentWeight} kg` : '--'}
          icon={Scale}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-400/10"
        />
        <StatCard
          title="Starting Weight"
          value={progress?.startWeight ? `${progress.startWeight} kg` : '--'}
          icon={Calendar}
          iconColor="text-purple-400"
          iconBg="bg-purple-400/10"
        />
        <StatCard
          title="Weight Change"
          value={`${weightChange >= 0 ? '+' : ''}${weightChange} kg`}
          icon={isLosingWeight ? TrendingDown : TrendingUp}
          iconColor={isLosingWeight ? 'text-green-400' : 'text-orange-400'}
          iconBg={isLosingWeight ? 'bg-green-400/10' : 'bg-orange-400/10'}
        />
        <StatCard
          title="Target"
          value={progress?.targetWeight ? `${progress.targetWeight} kg` : 'Not Set'}
          icon={Target}
          iconColor="text-neon-green"
          iconBg="bg-neon-green/10"
        />
      </div>

      {/* Weight Progress Chart */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Weight Progress</h3>
          {progress?.progressPercentage > 0 && (
            <ProgressRing
              progress={progress.progressPercentage}
              size={60}
              strokeWidth={5}
              label="Goal"
            />
          )}
        </div>

        <div className="h-60 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progress?.logs || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(val) => format(new Date(val), 'MMM d')}
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
                labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
              />
              <Line
                type="monotone"
                dataKey="weight"
                name="Weight"
                stroke="#00FFFF"
                strokeWidth={2}
                dot={{ fill: '#00FFFF', strokeWidth: 2 }}
              />
              {progress?.targetWeight && (
                <ReferenceLine
                  y={progress.targetWeight}
                  stroke="#FF10F0"
                  strokeDasharray="5 5"
                  label={{ value: 'Target', fill: '#FF10F0', position: 'right' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Weight Entry */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Log Weight</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary flex items-center gap-2 py-2 px-4"
            >
              <Plus size={18} />
              Add Entry
            </button>
          </div>

          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-4 border-t border-dark-700/50"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newLog.date}
                    onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <NumberInput
                  label="Weight (kg)"
                  value={newLog.weight}
                  onChange={(val) => setNewLog({ ...newLog, weight: val })}
                  min={20}
                  max={300}
                  step={0.1}
                />
              </div>

              <NumberInput
                label="Body Fat % (optional)"
                value={newLog.bodyFat}
                onChange={(val) => setNewLog({ ...newLog, bodyFat: val })}
                min={1}
                max={50}
                step={0.1}
              />

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={newLog.notes}
                  onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                  className="input-field resize-none h-20"
                  placeholder="How are you feeling?"
                />
              </div>

              <button onClick={handleAddLog} className="btn-primary w-full">
                Save Entry
              </button>
            </motion.div>
          )}

          {/* Set Target */}
          <div className="mt-6 pt-6 border-t border-dark-700/50">
            <h4 className="text-sm font-medium text-dark-300 mb-3">Target Weight</h4>
            <div className="flex gap-3">
              <NumberInput
                value={targetWeight}
                onChange={setTargetWeight}
                min={20}
                max={300}
                step={0.1}
                className="flex-1"
              />
              <button onClick={handleUpdateTarget} className="btn-secondary">
                Update
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Recent Entries */}
        <GlassCard>
          <h3 className="text-lg font-semibold text-white mb-4">Recent Entries</h3>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-dark-400 text-center py-8">
                No weight entries yet. Add your first entry!
              </p>
            ) : (
              logs.slice(0, 10).map((log) => (
                <motion.div
                  key={log._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-dark-800/30 border border-dark-700/30"
                >
                  <div>
                    <p className="text-white font-medium">{log.weight} kg</p>
                    <p className="text-dark-400 text-sm">
                      {format(new Date(log.date), 'MMM d, yyyy')}
                    </p>
                    {log.bodyFat && (
                      <p className="text-dark-500 text-xs">BF: {log.bodyFat}%</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteLog(log._id)}
                    className="p-2 text-dark-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* Weekly Averages */}
      {progress?.weeklyAverage?.length > 0 && (
        <GlassCard>
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Averages</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-3">
            {progress.weeklyAverage.map((week) => (
              <div
                key={week.week}
                className="text-center p-3 rounded-xl bg-dark-800/30 border border-dark-700/30"
              >
                <p className="text-dark-400 text-xs">Week {week.week}</p>
                <p className="text-white font-semibold">{week.averageWeight}</p>
                <p className="text-dark-500 text-xs">kg</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default PhysiqueTracker;
