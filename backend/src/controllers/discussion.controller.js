import DiscussionPost from '../models/DiscussionPost.model.js';
import Sheet from '../models/Sheet.model.js';
import SheetProblem from '../models/SheetProblem.model.js';

// @desc    Get all discussion posts
// @route   GET /api/discussions
// @access  Private
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await DiscussionPost.find({ isDeleted: false })
      .populate('user', 'name email role')
      .populate('comments.user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DiscussionPost.countDocuments({ isDeleted: false });

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a discussion post
// @route   POST /api/discussions
// @access  Private
export const createPost = async (req, res) => {
  try {
    const { content, sharedSheetId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    // Check agreement
    if (!req.user.acceptedDiscussionAgreement) {
      return res.status(403).json({
        message: 'You must accept the community agreement before posting',
        requiresAgreement: true,
      });
    }

    const postData = {
      user: req.user._id,
      content: content.trim(),
    };

    // If sharing a sheet, capture a snapshot
    if (sharedSheetId) {
      const sheet = await Sheet.findOne({
        _id: sharedSheetId,
        user: req.user._id,
      });

      if (sheet) {
        postData.sharedSheet = sheet._id;
        postData.sharedSheetSnapshot = {
          name: sheet.name,
          category: sheet.category,
          color: sheet.color,
          totalProblems: sheet.totalProblems,
          solvedProblems: sheet.solvedProblems,
          topics: (sheet.topics || []).map((t) => ({
            name: t.name,
            totalProblems: t.totalProblems,
            solvedProblems: t.solvedProblems,
          })),
        };
      }
    }

    const post = await DiscussionPost.create(postData);

    // Populate user details for response
    await post.populate('user', 'name email role');

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle like on a post
// @route   POST /api/discussions/:id/like
// @access  Private
export const likePost = async (req, res) => {
  try {
    const post = await DiscussionPost.findById(req.params.id);
    if (!post || post.isDeleted) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id;
    const likeIndex = post.likes.findIndex(
      (id) => id.toString() === userId.toString()
    );

    if (likeIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();

    res.json({
      likesCount: post.likesCount,
      liked: likeIndex === -1, // true if we just added a like
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add comment to a post
// @route   POST /api/discussions/:id/comment
// @access  Private
export const commentPost = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await DiscussionPost.findById(req.params.id);
    if (!post || post.isDeleted) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      user: req.user._id,
      content: content.trim(),
    });

    await post.save();

    // Populate user info in the new comment
    await post.populate('comments.user', 'name email role');

    res.json(post);
  } catch (error) {
    console.error('Comment post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a post (author or admin)
// @route   DELETE /api/discussions/:id
// @access  Private
export const deletePost = async (req, res) => {
  try {
    const post = await DiscussionPost.findById(req.params.id);
    if (!post || post.isDeleted) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only author or admin can delete
    const isAuthor = post.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    post.isDeleted = true;
    await post.save();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Clone a shared sheet from a discussion post
// @route   POST /api/discussions/clone-sheet
// @access  Private
export const cloneSheet = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user._id;

    const post = await DiscussionPost.findById(postId);
    if (!post || post.isDeleted || !post.sharedSheet) {
      return res.status(404).json({ message: 'Post or shared sheet not found' });
    }

    // Load the original sheet
    const originalSheet = await Sheet.findById(post.sharedSheet);
    if (!originalSheet) {
      return res.status(404).json({ message: 'Original sheet no longer exists' });
    }

    // Create a cloned sheet for the current user
    const clonedSheet = await Sheet.create({
      user: userId,
      name: `${originalSheet.name} (Cloned)`,
      description: originalSheet.description,
      category: originalSheet.category,
      color: originalSheet.color,
      icon: originalSheet.icon,
      totalProblems: originalSheet.totalProblems,
      solvedProblems: 0,
      topics: (originalSheet.topics || []).map((t) => ({
        name: t.name,
        totalProblems: t.totalProblems,
        solvedProblems: 0,
        order: t.order,
      })),
    });

    // Clone all SheetProblems
    const originalProblems = await SheetProblem.find({ sheet: originalSheet._id });

    if (originalProblems.length > 0) {
      const clonedProblems = originalProblems.map((p) => ({
        user: userId,
        sheet: clonedSheet._id,
        title: p.title,
        topic: p.topic,
        difficulty: p.difficulty,
        problemLink: p.problemLink,
        articleLink: p.articleLink,
        youtubeLink: p.youtubeLink,
        problemKey: p.problemKey,
        platform: p.platform,
        tags: p.tags,
        order: p.order,
        status: 'pending',
      }));

      await SheetProblem.insertMany(clonedProblems);
    }

    res.status(201).json({
      message: 'Sheet cloned successfully',
      sheet: clonedSheet,
      problemsCloned: originalProblems.length,
    });
  } catch (error) {
    console.error('Clone sheet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
