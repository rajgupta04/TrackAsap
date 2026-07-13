import CustomTask from '../models/CustomTask.model.js';
import TaskLog from '../models/TaskLog.model.js';

// Create a new custom task
export const createTask = async (req, res) => {
  try {
    const { title, startDate, endDate, daysOfWeek, specificDate } = req.body;

    const task = await CustomTask.create({
      user: req.user._id,
      title,
      startDate,
      endDate,
      daysOfWeek,
      specificDate,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

// Get all tasks for the logged-in user
export const getTasks = async (req, res) => {
  try {
    const tasks = await CustomTask.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

// Toggle a task for a specific date
export const toggleTaskLog = async (req, res) => {
  try {
    const { taskId, date } = req.body;
    // Normalize date to start of day
    const logDate = new Date(date);
    logDate.setUTCHours(0, 0, 0, 0);

    let log = await TaskLog.findOne({ task: taskId, user: req.user._id, date: logDate });

    if (log) {
      // Toggle completion status
      log.completed = !log.completed;
      await log.save();
    } else {
      // Create new log
      log = await TaskLog.create({
        task: taskId,
        user: req.user._id,
        date: logDate,
        completed: true,
      });
    }

    res.json(log);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling task log', error: error.message });
  }
};

// Get completion logs for the user within a date range
export const getTaskLogs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = { user: req.user._id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const logs = await TaskLog.find(query);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task logs', error: error.message });
  }
};

// Delete a task and its associated logs
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await CustomTask.findOneAndDelete({ _id: id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Delete associated logs
    await TaskLog.deleteMany({ task: id, user: req.user._id });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

// Get the current streak based on task completions
export const getTaskStreak = async (req, res) => {
  try {
    // Get all completed task logs for this user
    const completedLogs = await TaskLog.find({
      user: req.user._id,
      completed: true,
    }).sort({ date: -1 }).select('date');

    // Get unique dates in YYYY-MM-DD format
    const uniqueDates = [...new Set(completedLogs.map(log => {
      const d = new Date(log.date);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    }))];

    if (uniqueDates.length === 0) {
      return res.json({ currentStreak: 0, longestStreak: 0 });
    }

    // Sort unique dates descending
    uniqueDates.sort((a, b) => new Date(b) - new Date(a));

    const today = new Date();
    const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
    
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`;

    let currentStreak = 0;
    
    // Streak only counts if active today or yesterday
    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      let currentDate = new Date(uniqueDates[0]);
      currentStreak = 1;

      for (let i = 1; i < uniqueDates.length; i++) {
        const expectedPrev = new Date(currentDate);
        expectedPrev.setUTCDate(expectedPrev.getUTCDate() - 1);
        const expectedPrevStr = `${expectedPrev.getUTCFullYear()}-${String(expectedPrev.getUTCMonth() + 1).padStart(2, '0')}-${String(expectedPrev.getUTCDate()).padStart(2, '0')}`;

        if (uniqueDates[i] === expectedPrevStr) {
          currentStreak++;
          currentDate = expectedPrev;
        } else {
          break;
        }
      }
    }

    res.json({ currentStreak, longestStreak: 0 }); // Can calculate longest streak later if needed
  } catch (error) {
    res.status(500).json({ message: 'Error calculating streak', error: error.message });
  }
};
