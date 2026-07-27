import CustomTask from '../models/CustomTask.model.js';
import TaskLog from '../models/TaskLog.model.js';
import SheetProblem from '../models/SheetProblem.model.js';
import User from '../models/User.model.js';

// Create a new custom task
export const createTask = async (req, res) => {
  try {
    const { title, startDate, endDate, daysOfWeek, specificDate } = req.body;

    const existingTask = await CustomTask.findOne({ 
      user: req.user._id, 
      title: { $regex: new RegExp(`^${title.trim()}$`, 'i') } 
    });
    
    if (existingTask) {
      return res.status(400).json({ message: 'A task with this title already exists' });
    }

    const task = await CustomTask.create({
      user: req.user._id,
      title: title.trim(),
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

// Get the current streak based on task completions and solved problems
export const getTaskStreak = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Get all completed task logs for this user
    const taskLogs = await TaskLog.find({
      user: userId,
      completed: true,
    }).select('date createdAt');

    // 2. Group task logs by YYYY-MM-DD and count them
    // Only count tasks that were logged within 36 hours of their target date (retroactive logging prevention)
    const taskCountByDate = {};
    taskLogs.forEach(log => {
      const targetDate = new Date(log.date);
      const createdDate = new Date(log.createdAt);
      const diffHours = (createdDate - targetDate) / (1000 * 60 * 60);

      // Only count if logged within 36 hours of the target date (midnight UTC)
      if (diffHours <= 36) {
        const dateStr = targetDate.toISOString().split('T')[0];
        taskCountByDate[dateStr] = (taskCountByDate[dateStr] || 0) + 1;
      }
    });

    // 3. Get all SheetProblems solved with code and notes by this user
    const sheetProblems = await SheetProblem.find({ 
      user: userId, 
      status: 'solved',
      code: { $exists: true, $ne: '' },
      notes: { $exists: true, $ne: '' }
    }).select('lastAttemptedAt updatedAt');

    const problemDates = new Set();
    sheetProblems.forEach(p => {
      // Use lastAttemptedAt if available, otherwise fallback to updatedAt
      const d = new Date(p.lastAttemptedAt || p.updatedAt);
      const dateStr = d.toISOString().split('T')[0];
      problemDates.add(dateStr);
    });

    // 4. Find all valid dates (>= 2 tasks OR >= 1 problem with code+notes)
    const validDates = new Set();
    
    Object.keys(taskCountByDate).forEach(dateStr => {
      if (taskCountByDate[dateStr] >= 2) {
        validDates.add(dateStr);
      }
    });

    problemDates.forEach(dateStr => {
      validDates.add(dateStr);
    });

    // 4b. Monthly Power-Up reset & include streakFreezeDates
    const currentMonth = new Date().toISOString().slice(0, 7);
    const userDoc = await User.findById(req.user._id);
    if (userDoc && userDoc.powerUpLastResetMonth !== currentMonth) {
      userDoc.powerUpsRemaining = 3;
      userDoc.powerUpLastResetMonth = currentMonth;
      await userDoc.save();
    }
    const powerUpsRemaining = userDoc?.powerUpsRemaining || 0;
    const freezeDates = userDoc?.streakFreezeDates || [];
    freezeDates.forEach(dateStr => {
      validDates.add(dateStr);
    });

    const sortedDates = Array.from(validDates).sort((a, b) => new Date(b) - new Date(a));

    if (sortedDates.length === 0) {
      return res.json({
        currentStreak: 0,
        longestStreak: 0,
        powerUpsRemaining,
        canRecoverStreak: false,
        recoverableStreak: 0,
        recoverableGapDate: null,
      });
    }

    // 5. Calculate streak looking backwards from today or yesterday
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    let currentStreak = 0;

    // Find the first date that is not in the distant future (<= tomorrow)
    let startIndex = sortedDates.findIndex(date => date <= tomorrowStr);

    if (startIndex !== -1) {
      const latestValidDate = sortedDates[startIndex];
      
      // Streak is alive if they were active today, yesterday, or tomorrow (timezone offset)
      if (latestValidDate === tomorrowStr || latestValidDate === todayStr || latestValidDate === yesterdayStr) {
        currentStreak = 1;
        let currentDateStr = latestValidDate;

        for (let i = startIndex + 1; i < sortedDates.length; i++) {
          const expectedPrev = new Date(currentDateStr);
          expectedPrev.setDate(expectedPrev.getDate() - 1);
          const expectedPrevStr = expectedPrev.toISOString().split('T')[0];

          if (sortedDates[i] === expectedPrevStr) {
            currentStreak++;
            currentDateStr = expectedPrevStr;
          } else {
            break; // Streak broken
          }
        }
      }
    }

    // 6. Check if user has a 1-day gap (yesterday missed) and can use a Power-Up to recover streak
    let canRecoverStreak = false;
    let recoverableStreak = 0;
    let recoverableGapDate = null;

    if (powerUpsRemaining > 0 && !validDates.has(yesterdayStr)) {
      const tempSet = new Set(validDates);
      tempSet.add(yesterdayStr);
      const tempSorted = Array.from(tempSet).sort((a, b) => new Date(b) - new Date(a));
      let tempIndex = tempSorted.findIndex(d => d <= tomorrowStr);
      if (tempIndex !== -1) {
        const latestDate = tempSorted[tempIndex];
        if (latestDate === tomorrowStr || latestDate === todayStr || latestDate === yesterdayStr) {
          let testStreak = 1;
          let testDateStr = latestDate;
          for (let i = tempIndex + 1; i < tempSorted.length; i++) {
            const expPrev = new Date(testDateStr);
            expPrev.setDate(expPrev.getDate() - 1);
            const expPrevStr = expPrev.toISOString().split('T')[0];
            if (tempSorted[i] === expPrevStr) {
              testStreak++;
              testDateStr = expPrevStr;
            } else {
              break;
            }
          }
          if (testStreak > currentStreak && testStreak >= 2) {
            canRecoverStreak = true;
            recoverableStreak = testStreak;
            recoverableGapDate = yesterdayStr;
          }
        }
      }
    }

    res.json({
      currentStreak,
      longestStreak: Math.max(currentStreak, recoverableStreak),
      powerUpsRemaining,
      canRecoverStreak,
      recoverableStreak,
      recoverableGapDate,
    });
  } catch (error) {
    console.error('Error calculating streak:', error);
    res.status(500).json({ message: 'Error calculating streak', error: error.message });
  }
};

// Use a Streak Recovery Power-Up to cover a 1-day gap
export const usePowerUp = async (req, res) => {
  try {
    const { gapDate } = req.body;
    const userDoc = await User.findById(req.user._id);
    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' });
    }

    if ((userDoc.powerUpsRemaining || 0) <= 0) {
      return res.status(400).json({ message: 'No Power-Ups remaining this month' });
    }

    const dateToCover = gapDate || new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (!userDoc.streakFreezeDates) {
      userDoc.streakFreezeDates = [];
    }

    if (userDoc.streakFreezeDates.includes(dateToCover)) {
      return res.status(400).json({ message: 'Power-Up already used for this date' });
    }

    userDoc.streakFreezeDates.push(dateToCover);
    userDoc.powerUpsRemaining = Math.max(0, userDoc.powerUpsRemaining - 1);
    await userDoc.save();

    res.json({
      success: true,
      message: '⚡ Streak Power-Up activated! Your streak has been recovered.',
      powerUpsRemaining: userDoc.powerUpsRemaining,
      streakFreezeDates: userDoc.streakFreezeDates,
    });
  } catch (error) {
    console.error('Use Power-Up error:', error);
    res.status(500).json({ message: 'Error activating Power-Up', error: error.message });
  }
};
