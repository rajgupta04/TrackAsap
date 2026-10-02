import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    companyColor: {
      type: String,
      default: '#4285F4',
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: '',
      trim: true,
    },
    avatarInitials: {
      type: String,
      default: '',
      trim: true,
    },
    quote: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    verifiedLabel: {
      type: String,
      default: 'Verified Industry Engineer',
      trim: true,
    },
    userTag: {
      type: String,
      default: 'TrackAsap User',
      trim: true,
    },
    spotlightColor: {
      type: String,
      default: 'rgba(66, 133, 244, 0.18)',
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

testimonialSchema.index({ order: 1, createdAt: -1 });

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

export default Testimonial;
