import DiscussionPost from '../models/DiscussionPost.model.js';
import Sheet from '../models/Sheet.model.js';
import SheetProblem from '../models/SheetProblem.model.js';
import { uploadToCloudinaryOrLocal } from '../middleware/uploadHubAttachment.js';

// @desc    Get all discussion/hub posts with filtering and search
// @route   GET /api/discussions or /api/hub
// @access  Private
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { category, search, tag } = req.query;

    const filter = { isDeleted: false };

    // Category filtering
    if (category && category !== 'all') {
      if (category === 'sheet') {
        filter.$or = [{ category: 'sheet' }, { sharedSheet: { $ne: null } }];
      } else if (category === 'notes') {
        filter.$or = [
          { category: 'notes' },
          { 'attachment.fileType': { $in: ['pdf', 'doc'] } },
        ];
      } else {
        filter.category = category;
      }
    }

    // Tag filtering
    if (tag && tag.trim()) {
      filter.tags = tag.trim().toLowerCase().replace(/^#/, '');
    }

    // Search query across title, content, tags, attachment name, and sheet name
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchConditions = [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex },
        { 'attachment.fileName': searchRegex },
        { 'sharedSheetSnapshot.name': searchRegex },
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    const posts = await DiscussionPost.find(filter)
      .populate('user', 'name email role profilePicture googlePicture')
      .populate('comments.user', 'name email role profilePicture googlePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DiscussionPost.countDocuments(filter);

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

// @desc    Create a hub resource / discussion post
// @route   POST /api/discussions or /api/hub
// @access  Private
export const createPost = async (req, res) => {
  try {
    const { content, sharedSheetId, title, category, tags } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Post content or description is required' });
    }

    // Check agreement
    if (!req.user.acceptedDiscussionAgreement) {
      return res.status(403).json({
        message: 'You must accept the community agreement before posting',
        requiresAgreement: true,
      });
    }

    if (!req.user.isEmailVerified && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Please verify your email before posting in discussions.' });
    }

    // Process tags
    let parsedTags = [];
    if (Array.isArray(tags)) {
      parsedTags = tags.map((t) => String(t).trim().toLowerCase().replace(/^#/, '')).filter(Boolean);
    } else if (typeof tags === 'string' && tags.trim()) {
      try {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) {
          parsedTags = parsed.map((t) => String(t).trim().toLowerCase().replace(/^#/, '')).filter(Boolean);
        } else {
          parsedTags = tags.split(',').map((t) => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean);
        }
      } catch {
        parsedTags = tags.split(',').map((t) => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean);
      }
    }

    // Handle file upload if present
    let attachmentData = {
      fileUrl: '',
      fileName: '',
      fileSize: 0,
      fileType: 'none',
      mimeType: '',
      downloadsCount: 0,
    };

    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinaryOrLocal(req.file);
        if (uploadResult) {
          attachmentData = {
            ...attachmentData,
            ...uploadResult,
          };
        }
      } catch (uploadErr) {
        console.error('File upload processing error:', uploadErr);
        return res.status(500).json({ message: 'File upload failed. Please try again.' });
      }
    }

    // Determine category intelligently if default
    let finalCategory = category || 'general';
    if (finalCategory === 'general') {
      if (attachmentData.fileType === 'pdf' || attachmentData.fileType === 'doc') {
        finalCategory = 'notes';
      } else if (sharedSheetId) {
        finalCategory = 'sheet';
      }
    }

    const postData = {
      user: req.user._id,
      title: (title || '').trim(),
      content: content.trim(),
      category: finalCategory,
      tags: parsedTags,
      attachment: attachmentData,
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
    await post.populate('user', 'name email role profilePicture googlePicture');

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

    if (!req.user.isEmailVerified && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Please verify your email before posting in discussions.' });
    }

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
    await post.populate('comments.user', 'name email role profilePicture googlePicture');

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
    const {
      postId,
      name,
      includeProgress = false,
      includeNotes = false,
      includeCode = false,
    } = req.body;
    const userId = req.user._id;

    if (!req.user.isEmailVerified && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Please verify your email before posting in discussions.' });
    }

    const post = await DiscussionPost.findById(postId).populate('user', 'name profilePicture googlePicture');
    if (!post || post.isDeleted || !post.sharedSheet) {
      return res.status(404).json({ message: 'Post or shared sheet not found' });
    }

    // Load the original sheet
    const originalSheet = await Sheet.findById(post.sharedSheet).populate('user', 'name profilePicture googlePicture');
    if (!originalSheet) {
      return res.status(404).json({ message: 'Original sheet no longer exists' });
    }

    // Determine original creator attribution & credits
    const authorUser = originalSheet.user || post.user;
    const authorName = authorUser?.name || post.user?.name || post.sharedSheetSnapshot?.authorName || 'Community Member';
    const authorAvatar = authorUser?.profilePicture || authorUser?.googlePicture || post.user?.profilePicture || post.user?.googlePicture || '';

    // Load original problems
    const originalProblems = await SheetProblem.find({ sheet: originalSheet._id });

    const shouldIncludeProgress = Boolean(includeProgress);
    const shouldIncludeNotes = Boolean(includeNotes);
    const shouldIncludeCode = Boolean(includeCode);

    const solvedCount = shouldIncludeProgress
      ? originalProblems.filter((p) => p.status === 'solved').length
      : 0;

    // Create a cloned sheet for the current user with non-removable credits
    const clonedSheet = await Sheet.create({
      user: userId,
      name: name?.trim() || `${originalSheet.name} (Cloned)`,
      description: originalSheet.description,
      category: originalSheet.category,
      color: originalSheet.color || '#39FF14',
      icon: originalSheet.icon || 'code',
      totalProblems: originalProblems.length || originalSheet.totalProblems || 0,
      solvedProblems: solvedCount,
      isActive: true,
      isCloned: true,
      clonedFrom: {
        user: authorUser?._id || null,
        authorName,
        authorAvatar,
        originalSheet: originalSheet._id,
        originalSheetName: originalSheet.name,
        postId: post._id,
        clonedAt: new Date(),
      },
      topics: (originalSheet.topics || []).map((t) => ({
        name: t.name,
        totalProblems: t.totalProblems,
        solvedProblems: shouldIncludeProgress
          ? originalProblems.filter((p) => p.topic === t.name && p.status === 'solved').length
          : 0,
        order: t.order,
      })),
    });

    // Clone all SheetProblems
    if (originalProblems.length > 0) {
      const clonedProblems = originalProblems.map((p) => ({
        user: userId,
        sheet: clonedSheet._id,
        title: p.title,
        topic: p.topic,
        problemNumber: p.problemNumber,
        difficulty: p.difficulty,
        problemLink: p.problemLink,
        articleLink: p.articleLink,
        youtubeLink: p.youtubeLink,
        problemKey: p.problemKey,
        platform: p.platform,
        tags: p.tags,
        order: p.order,
        status: shouldIncludeProgress ? p.status || 'pending' : 'pending',
        notes: shouldIncludeNotes ? p.notes || '' : '',
        code: shouldIncludeCode ? p.code || '' : '',
        language: shouldIncludeCode ? p.language || 'cpp' : 'cpp',
        solutions: shouldIncludeCode && Array.isArray(p.solutions)
          ? p.solutions.map((s) => ({
              language: s.language,
              code: s.code,
              label: s.label,
            }))
          : [],
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

// @desc    Track attachment download count
// @route   POST /api/discussions/:id/download or /api/hub/:id/download
// @access  Private
export const trackDownload = async (req, res) => {
  try {
    const post = await DiscussionPost.findById(req.params.id);
    if (!post || post.isDeleted || !post.attachment?.fileUrl) {
      return res.status(404).json({ message: 'Resource attachment not found' });
    }

    post.attachment.downloadsCount = (post.attachment.downloadsCount || 0) + 1;
    await post.save();

    res.json({
      downloadsCount: post.attachment.downloadsCount,
      fileUrl: post.attachment.fileUrl,
      fileName: post.attachment.fileName,
    });
  } catch (error) {
    console.error('Track download error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
