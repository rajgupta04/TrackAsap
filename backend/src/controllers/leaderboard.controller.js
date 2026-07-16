import LeaderboardProfile from '../models/LeaderboardProfile.model.js';
import User from '../models/User.model.js';
import { leaderboardService } from '../services/leaderboard.service.js';

/**
 * Helper function to handle paginated queries
 */
const getPaginatedLeaderboard = async (query, sortCriteria, page, limit) => {
  const skip = (page - 1) * limit;

  // TODO: REDIS_INTEGRATION_POINT
  // When Redis is active, we'll bypass this MongoDB query.
  // We'll use `ZREVRANGE leaderboard:global <skip> <skip + limit - 1>`
  // Then we'll take the returned userIds and fetch their populated profiles from MongoDB in one batch.

  const total = await LeaderboardProfile.countDocuments(query);
  const leaderboard = await LeaderboardProfile.find(query)
    .sort(sortCriteria)
    .skip(skip)
    .limit(limit)
    .populate('user', 'name codeforcesHandle leetcodeHandle codechefHandle avatar college'); // Only fetching necessary fields

  return {
    leaderboard,
    totalPages: Math.ceil(total / limit),
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
      // Find users matching search, then find their leaderboard profiles
      const users = await User.find({ name: { $regex: searchQuery, $options: 'i' } }, '_id');
      const userIds = users.map((u) => u._id);
      query = { user: { $in: userIds } };
    }

    const data = await getPaginatedLeaderboard(query, { globalScore: -1 }, page, limit);
    res.json(data);
  } catch (error) {
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
    
    // TODO: REDIS_INTEGRATION_POINT -> Query `leaderboard:weekly`
    const data = await getPaginatedLeaderboard({}, { weeklyScore: -1 }, page, limit);
    res.json(data);
  } catch (error) {
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
    
    // TODO: REDIS_INTEGRATION_POINT -> Query `leaderboard:monthly`
    const data = await getPaginatedLeaderboard({}, { monthlyScore: -1 }, page, limit);
    res.json(data);
  } catch (error) {
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
    
    // TODO: REDIS_INTEGRATION_POINT -> Query `leaderboard:college:<collegeName>`
    const data = await getPaginatedLeaderboard({ college: collegeName }, { globalScore: -1 }, page, limit);
    res.json(data);
  } catch (error) {
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
    let lbProfile = await LeaderboardProfile.findOne({ user: userId });

    // If they don't have a profile yet, try to generate it now
    if (!lbProfile) {
      lbProfile = await leaderboardService.updateUserScore(userId);
    }
    
    if (!lbProfile) {
      return res.status(404).json({ message: 'Leaderboard profile not found' });
    }

    // TODO: REDIS_INTEGRATION_POINT
    // In MongoDB, finding the absolute rank requires counting all documents with a higher score.
    // This is O(N). With Redis, we will use ZREVRANK to get the rank in O(log(N)).
    // Example: const globalRank = await redisClient.zrevrank('leaderboard:global', userId);
    
    const globalRank = await LeaderboardProfile.countDocuments({ globalScore: { $gt: lbProfile.globalScore } }) + 1;
    const weeklyRank = await LeaderboardProfile.countDocuments({ weeklyScore: { $gt: lbProfile.weeklyScore } }) + 1;
    const monthlyRank = await LeaderboardProfile.countDocuments({ monthlyScore: { $gt: lbProfile.monthlyScore } }) + 1;

    res.json({
      profile: lbProfile,
      ranks: {
        global: globalRank,
        weekly: weeklyRank,
        monthly: monthlyRank,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
