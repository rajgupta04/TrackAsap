import { useEffect, useState, useMemo } from 'react';
import { format, addDays, subDays, parseISO, startOfDay, isWithinInterval } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Trash2,
  Activity,
  CheckCircle2,
  Circle,
  X
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { useTaskStore } from '../store/taskStore';
import GlassCard from '../components/ui/GlassCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StreakAnimation from '../components/StreakAnimation';
import { Flame } from 'lucide-react';

const RANGES = [
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'All', days: 9999 },
];

const PREMADE_TASKS = [
  "DSA",
  "Computer Fundamentals",
  "DBMS",
  "LLD",
  "HLD",
  "Competitive Programming",
  "Contest-Leetcode",
  "Contest-Codechef",
  "Web Development",
  "Open Source",
  "Gym/Fitness",
  "Clean Diet"
];

const DailyTracker = () => {
  const { tasks, taskLogs, streak, isLoading, fetchTasks, fetchTaskLogs, toggleTaskLog, deleteTask, createTask } = useTaskStore();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [chartRange, setChartRange] = useState(7);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [prevStreak, setPrevStreak] = useState(0);
  
  // Modal state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState('recurring'); // 'recurring' or 'one_time'
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [specificDate, setSpecificDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  useEffect(() => {
    fetchTasks();
    // Fetch logs for the selected chart range
    const start = format(subDays(new Date(), chartRange === 9999 ? 365 * 5 : chartRange), 'yyyy-MM-dd');
    const end = format(new Date(), 'yyyy-MM-dd');
    fetchTaskLogs(start, end);
  }, [chartRange, fetchTasks, fetchTaskLogs]);

  useEffect(() => {
    if (streak?.currentStreak > prevStreak && prevStreak > 0) {
      setShowStreakAnimation(true);
    }
    setPrevStreak(streak?.currentStreak || 0);
  }, [streak?.currentStreak]);

  const handleQuickAdd = (title) => {
    setTaskTitle(title);
    setTaskType('recurring'); // Default to recurring for habits
    setIsModalOpen(true);
  };

  const handleDateChange = (date) => setSelectedDate(date);
  const handlePrevDay = () => handleDateChange(format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'));
  const handleNextDay = () => handleDateChange(format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'));

  // Filter tasks for the selected date
  const tasksForSelectedDate = useMemo(() => {
    const date = parseISO(selectedDate);
    const dayOfWeek = date.getDay();

    return tasks.filter((task) => {
      // If it's a one-time task
      if (task.specificDate) {
        return format(parseISO(task.specificDate), 'yyyy-MM-dd') === selectedDate;
      }
      
      // If it's a recurring task
      if (task.startDate) {
        const start = parseISO(task.startDate);
        const end = task.endDate ? parseISO(task.endDate) : new Date(2099, 0, 1);
        
        // Check if within date range
        if (date >= startOfDay(start) && date <= startOfDay(end)) {
          // Check days of week
          if (!task.daysOfWeek || task.daysOfWeek.length === 0) return true; // Everyday
          return task.daysOfWeek.includes(dayOfWeek);
        }
      }
      return false;
    });
  }, [tasks, selectedDate]);

  // Aggregate data for the chart
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    const daysToLookBack = chartRange === 9999 ? 365 : chartRange; // Limit "All" to 1 year for performance if needed
    
    for (let i = daysToLookBack - 1; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      // Count completed logs for this date
      const completedCount = taskLogs.filter(
        (log) => format(parseISO(log.date), 'yyyy-MM-dd') === dateStr && log.completed
      ).length;
      
      data.push({
        date: format(d, 'MMM dd'),
        fullDate: dateStr,
        completed: completedCount
      });
    }
    return data;
  }, [taskLogs, chartRange]);

  const handleToggleTask = async (taskId) => {
    try {
      await toggleTaskLog(taskId, selectedDate);
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (confirm('Are you sure you want to delete this task completely?')) {
      await deleteTask(taskId);
      toast.success('Task deleted');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    const payload = { title: taskTitle.trim() };
    if (taskType === 'one_time') {
      payload.specificDate = specificDate;
    } else {
      payload.startDate = startDate;
      if (endDate) payload.endDate = endDate;
      // For simplicity, we apply to all days in range. 
      // Could add days of week selector later if needed.
    }

    const res = await createTask(payload);
    if (res.success) {
      toast.success('Task created');
      setIsModalOpen(false);
      setTaskTitle('');
    } else {
      toast.error(res.error || 'Failed to create task');
    }
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6 pb-24">
      {/* Chart Section */}
      <GlassCard className="relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-neon-green" />
            <h2 className="text-xl font-bold text-white">Activity Overview</h2>
          </div>
          
          <div className="flex bg-dark-800/80 rounded-lg p-1 border border-white/5">
            {RANGES.map((range) => (
              <button
                key={range.label}
                onClick={() => setChartRange(range.days)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  chartRange === range.days
                    ? 'bg-neon-green/20 text-neon-green'
                    : 'text-dark-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#39FF14" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#39FF14" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                axisLine={false}
                tickLine={false}
                minTickGap={30}
              />
              <YAxis 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ color: '#39FF14' }}
              />
              <Area 
                type="monotone" 
                dataKey="completed" 
                name="Tasks Completed" 
                stroke="#39FF14" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCompleted)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Daily Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Date Navigator */}
          <GlassCard className="flex items-center justify-between">
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 text-white transition-colors"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-neon-green" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-transparent text-white text-lg font-semibold focus:outline-none"
              />
            </div>

            <button
              onClick={handleNextDay}
              className="p-2 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 text-white transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </GlassCard>

          {/* Tasks List */}
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Daily Tasks</h3>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-green/10 text-neon-green hover:bg-neon-green/20 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>

            {tasksForSelectedDate.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-dark-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-dark-400" />
                </div>
                <p className="text-dark-300">No tasks scheduled for this day.</p>
                <p className="text-sm text-dark-400 mt-1">Add a one-time task or a recurring habit.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasksForSelectedDate.map((task) => {
                  const isCompleted = taskLogs.some(
                    (log) => log.task === task._id && format(parseISO(log.date), 'yyyy-MM-dd') === selectedDate && log.completed
                  );

                  return (
                    <div 
                      key={task._id} 
                      className={`group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                        isCompleted 
                          ? 'bg-neon-green/5 border-neon-green/20' 
                          : 'bg-dark-800/40 border-white/5 hover:border-white/10 hover:bg-dark-700/40'
                      }`}
                      onClick={() => handleToggleTask(task._id)}
                    >
                      <div className="flex items-center gap-4">
                        <button className={`transition-colors ${isCompleted ? 'text-neon-green' : 'text-dark-400 group-hover:text-dark-300'}`}>
                          {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                        </button>
                        <div>
                          <p className={`font-medium transition-colors ${isCompleted ? 'text-white line-through opacity-70' : 'text-white'}`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-dark-400 mt-0.5">
                            {task.specificDate ? 'One-time Task' : 'Recurring Habit'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-dark-400 hover:text-red-400 transition-all rounded-lg hover:bg-red-400/10"
                        title="Delete Task Completely"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Sidebar/Stats could go here */}
        <div className="space-y-6">
          <GlassCard>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-dark-800/50 border border-white/5">
                <p className="text-sm text-dark-300">Total Active Tasks</p>
                <p className="text-2xl font-bold text-white mt-1">{tasks.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-neon-green/10 border border-neon-green/20">
                <p className="text-sm text-neon-green">Completions Today</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {taskLogs.filter(log => format(parseISO(log.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && log.completed).length}
                </p>
            </div>
            
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-400">Current Streak</p>
                  <p className="text-2xl font-bold text-white mt-1">{streak?.currentStreak || 0} Days</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Quick Add Tasks */}
          <GlassCard>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Add</h3>
            <div className="flex flex-wrap gap-2">
              {PREMADE_TASKS.map((title) => (
                <button
                  key={title}
                  onClick={() => handleQuickAdd(title)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-dark-800/80 border border-white/5 text-dark-300 hover:text-white hover:border-neon-green/50 hover:bg-neon-green/10 transition-colors"
                >
                  + {title}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>


      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-dark-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-6">Create New Task</h2>
            
            <form onSubmit={handleCreateTask} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Task Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-neon-green transition-colors"
                  placeholder="e.g. Read 10 pages"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Schedule Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTaskType('recurring')}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors border ${
                      taskType === 'recurring' 
                        ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' 
                        : 'bg-dark-800 border-dark-600 text-dark-300 hover:text-white'
                    }`}
                  >
                    Recurring
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskType('one_time')}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors border ${
                      taskType === 'one_time' 
                        ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' 
                        : 'bg-dark-800 border-dark-600 text-dark-300 hover:text-white'
                    }`}
                  >
                    One-time
                  </button>
                </div>
              </div>

              {taskType === 'recurring' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neon-green"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neon-green"
                    />
                    <p className="text-[10px] text-dark-400 mt-1">Leave empty for forever</p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Specific Date</label>
                  <input
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-neon-green"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-neon-green text-dark-900 font-bold hover:bg-[#32e012] transition-colors mt-2 shadow-[0_0_15px_rgba(57,255,20,0.3)]"
              >
                Save Task
              </button>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Streak Animation */}
      <StreakAnimation
        streak={streak?.currentStreak || 0}
        show={showStreakAnimation}
        onComplete={() => setShowStreakAnimation(false)}
      />
    </div>
  );
};

export default DailyTracker;
