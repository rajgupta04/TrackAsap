import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

const discussionPostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      maxlength: 5000,
    },
    // Optional shared sheet
    sharedSheet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sheet',
      default: null,
    },
    // Cached sheet info so it persists even if original is deleted
    sharedSheetSnapshot: {
      name: { type: String, default: '' },
      category: { type: String, default: '' },
      color: { type: String, default: '' },
      totalProblems: { type: Number, default: 0 },
      solvedProblems: { type: Number, default: 0 },
      topics: [
        {
          name: String,
          totalProblems: { type: Number, default: 0 },
          solvedProblems: { type: Number, default: 0 },
        },
      ],
    },
    // Likes
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    // Comments
    comments: [commentSchema],
    commentsCount: {
      type: Number,
      default: 0,
    },
    // Soft-delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Keep counts in sync
discussionPostSchema.pre('save', function (next) {
  this.likesCount = (this.likes || []).length;
  this.commentsCount = (this.comments || []).length;
  next();
});

// Indexes
discussionPostSchema.index({ createdAt: -1 });
discussionPostSchema.index({ user: 1, createdAt: -1 });
discussionPostSchema.index({ isDeleted: 1, createdAt: -1 });

const DiscussionPost = mongoose.model('DiscussionPost', discussionPostSchema);
export default DiscussionPost;
