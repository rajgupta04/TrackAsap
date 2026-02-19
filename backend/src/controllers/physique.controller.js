import PhysiqueLog from '../models/PhysiqueLog.model.js';
import User from '../models/User.model.js';

// Helper: Calculate week number from start date
const calculateWeekNumber = (startDate, targetDate) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffTime = target - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.ceil((diffDays + 1) / 7));
};

// @desc    Add physique log
// @route   POST /api/physique
// @access  Private
export const addPhysiqueLog = async (req, res) => {
  try {
    const { date, weight, bodyFat, measurements, notes } = req.body;

    const user = await User.findById(req.user._id);
    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);

    const weekNumber = calculateWeekNumber(user.startDate, logDate);

    // Check for existing log on same date
    let physiqueLog = await PhysiqueLog.findOne({
      user: req.user._id,
      date: logDate,
    });

    if (physiqueLog) {
      // Update existing
      physiqueLog.weight = weight;
      if (bodyFat !== undefined) physiqueLog.bodyFat = bodyFat;
      if (measurements) physiqueLog.measurements = { ...physiqueLog.measurements, ...measurements };
      if (notes !== undefined) physiqueLog.notes = notes;
      physiqueLog.weekNumber = weekNumber;

      await physiqueLog.save();
    } else {
      // Create new
      physiqueLog = await PhysiqueLog.create({
        user: req.user._id,
        date: logDate,
        weight,
        bodyFat,
        measurements: measurements || {},
        weekNumber,
        notes: notes || '',
      });
    }

    res.status(201).json(physiqueLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all physique logs
// @route   GET /api/physique
// @access  Private
export const getAllPhysiqueLogs = async (req, res) => {
  try {
    const logs = await PhysiqueLog.find({ user: req.user._id })
      .sort({ date: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get physique progress summary
// @route   GET /api/physique/progress
// @access  Private
export const getPhysiqueProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const logs = await PhysiqueLog.find({ user: req.user._id })
      .sort({ date: 1 });

    if (logs.length === 0) {
      return res.json({
        startWeight: null,
        currentWeight: null,
        targetWeight: user.targetWeight,
        totalChange: 0,
        weeklyAverage: [],
        progressPercentage: 0,
      });
    }

    const startWeight = logs[0].weight;
    const currentWeight = logs[logs.length - 1].weight;
    const targetWeight = user.targetWeight;
    const totalChange = currentWeight - startWeight;

    // Calculate weekly averages
    const weeklyData = {};
    logs.forEach((log) => {
      if (!weeklyData[log.weekNumber]) {
        weeklyData[log.weekNumber] = { total: 0, count: 0 };
      }
      weeklyData[log.weekNumber].total += log.weight;
      weeklyData[log.weekNumber].count++;
    });

    const weeklyAverage = Object.entries(weeklyData).map(([week, data]) => ({
      week: parseInt(week),
      averageWeight: Math.round((data.total / data.count) * 10) / 10,
    }));

    // Calculate progress percentage towards target
    let progressPercentage = 0;
    if (targetWeight && startWeight !== targetWeight) {
      const totalRequired = Math.abs(targetWeight - startWeight);
      const achieved = Math.abs(currentWeight - startWeight);
      progressPercentage = Math.min(100, Math.round((achieved / totalRequired) * 100));
    }

    res.json({
      startWeight,
      currentWeight,
      targetWeight,
      totalChange: Math.round(totalChange * 10) / 10,
      weeklyAverage,
      progressPercentage,
      logs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete physique log
// @route   DELETE /api/physique/:id
// @access  Private
export const deletePhysiqueLog = async (req, res) => {
  try {
    const log = await PhysiqueLog.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
