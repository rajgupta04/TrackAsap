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
