import User from '../models/User.model.js';
import DiscussionPost from '../models/DiscussionPost.model.js';

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('name email role isBanned banReason bannedAt acceptedDiscussionAgreement createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle ban/unban user (admin only)
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
export const toggleBanUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent banning yourself or other admins
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot ban yourself' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot ban an admin user' });
    }

    // Toggle ban
    user.isBanned = !user.isBanned;
    user.banReason = user.isBanned ? (reason || 'Violation of community guidelines') : '';
    user.bannedAt = user.isBanned ? new Date() : null;
    await user.save();

    res.json({
      message: user.isBanned ? 'User banned successfully' : 'User unbanned successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isBanned: user.isBanned,
        banReason: user.banReason,
        bannedAt: user.bannedAt,
      },
    });
  } catch (error) {
    console.error('Toggle ban error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a discussion post as admin
// @route   DELETE /api/admin/posts/:id
// @access  Private/Admin
export const adminDeletePost = async (req, res) => {
  try {
    const post = await DiscussionPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.isDeleted = true;
    await post.save();

    res.json({ message: 'Post deleted by admin' });
  } catch (error) {
    console.error('Admin delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get dashboard stats for admin
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, bannedUsers, totalPosts] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBanned: true }),
      DiscussionPost.countDocuments({ isDeleted: false }),
    ]);

    res.json({
      totalUsers,
      bannedUsers,
      activeUsers: totalUsers - bannedUsers,
      totalPosts,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
