import LeaderboardProfile from '../models/LeaderboardProfile.model.js';
import User from '../models/User.model.js';
import { leaderboardService } from '../services/leaderboard.service.js';

/**
 * Helper function to handle paginated queries
 */
const getPaginatedLeaderboard = async (query, sortCriteria, page, limit) => {
  const skip = (page - 1) * limit;

  const total = await LeaderboardProfile.countDocuments(query);
  
  // If no profiles exist at all, kick off background calculation
  if (total === 0) {
    leaderboardService.updateAllUsers().catch((err) => console.error('Background leaderboard sync error:', err));
  }

  const rawLeaderboard = await LeaderboardProfile.find(query)
    .sort(sortCriteria)
    .skip(skip)
    .limit(limit)
    .populate('user', 'name codeforcesHandle leetcodeHandle codechefHandle profilePicture googlePicture githubUsername college avatarUrl')
    .lean();

  const leaderboard = rawLeaderboard.filter((item) => item.user != null);

  return {
    leaderboard,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    currentPage: page,
    totalUsers: total,
  };
};

/**
 * Get Global Leaderboard
 * GET /api/leaderboard/global?page=1&limit=50&search=john
 */
export const getGlobalLeaderboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const searchQuery = req.query.search;

    let query = {};
    if (searchQuery) {
      const users = await User.find({ name: { $regex: searchQuery, $options: 'i' } }, '_id');
      const userIds = users.map((u) => u._id);
      query = { user: { $in: userIds } };
    }

    const data = await getPaginatedLeaderboard(query, { globalScore: -1 }, page, limit);
    res.json(data);
  } catch (error) {
    console.error('getGlobalLeaderboard error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Get Weekly Leaderboard
 * GET /api/leaderboard/weekly?page=1&limit=50
 */
export const getWeeklyLeaderboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    const data = await getPaginatedLeaderboard({}, { weeklyScore: -1 }, page, limit);
    res.json(data);
  } catch (error) {
    console.error('getWeeklyLeaderboard error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Get Monthly Leaderboard
 * GET /api/leaderboard/monthly?page=1&limit=50
 */
export const getMonthlyLeaderboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    const data = await getPaginatedLeaderboard({}, { monthlyScore: -1 }, page, limit);
    res.json(data);
  } catch (error) {
    console.error('getMonthlyLeaderboard error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Get College Leaderboard
 * GET /api/leaderboard/college/:collegeName?page=1&limit=50
 */
export const getCollegeLeaderboard = async (req, res) => {
  try {
    const { collegeName } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    const data = await getPaginatedLeaderboard({ college: collegeName }, { globalScore: -1 }, page, limit);
    res.json(data);
  } catch (error) {
    console.error('getCollegeLeaderboard error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Get Current User's Rank
 * GET /api/leaderboard/me
 */
export const getCurrentUserRank = async (req, res) => {
  try {
    const userId = req.user._id;
    let lbProfile = await LeaderboardProfile.findOne({ user: userId })
      .populate('user', 'name codeforcesHandle leetcodeHandle codechefHandle profilePicture googlePicture githubUsername college avatarUrl')
      .lean();

    if (!lbProfile) {
      try {
        const created = await leaderboardService.updateUserScore(userId);
        if (created) {
          lbProfile = await LeaderboardProfile.findById(created._id)
            .populate('user', 'name codeforcesHandle leetcodeHandle codechefHandle profilePicture googlePicture githubUsername college avatarUrl')
            .lean();
        }
      } catch (err) {
        console.error('Error generating user score on the fly:', err);
      }
    }
    
    if (!lbProfile) {
      return res.json({
        profile: {
          user: req.user,
          globalScore: 0,
          weeklyScore: 0,
          monthlyScore: 0,
          statsBreakdown: { easySolved: 0, mediumSolved: 0, hardSolved: 0, currentStreak: 0, maxStreak: 0, totalTasksCompleted: 0 },
        },
        ranks: {
          global: 1,
          weekly: 1,
          monthly: 1,
        },
      });
    }

    const globalRank = (await LeaderboardProfile.countDocuments({ globalScore: { $gt: lbProfile.globalScore || 0 } })) + 1;
    const weeklyRank = (await LeaderboardProfile.countDocuments({ weeklyScore: { $gt: lbProfile.weeklyScore || 0 } })) + 1;
    const monthlyRank = (await LeaderboardProfile.countDocuments({ monthlyScore: { $gt: lbProfile.monthlyScore || 0 } })) + 1;

    res.json({
      profile: lbProfile,
      ranks: {
        global: globalRank,
        weekly: weeklyRank,
        monthly: monthlyRank,
      },
    });
  } catch (error) {
    console.error('getCurrentUserRank error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
