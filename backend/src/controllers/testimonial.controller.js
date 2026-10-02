import Testimonial from '../models/Testimonial.model.js';

export const DEFAULT_TESTIMONIALS = [
  {
    name: 'Aarav Sharma',
    role: 'Software Engineer II',
    company: 'Google',
    companyColor: '#4285F4',
    avatarInitials: 'AS',
    avatarUrl: '',
    quote: 'Tracking 500+ problems across LeetCode and Google interview sheets used to be a mess. TrackAsap’s GitHub auto-sync saved me hours during my technical prep!',
    spotlightColor: 'rgba(66, 133, 244, 0.18)',
    rating: 5,
    userTag: 'TrackAsap User',
    isVerified: true,
    verifiedLabel: 'Verified Industry Engineer',
    order: 0,
    isActive: true,
  },
  {
    name: 'Rhea Nair',
    role: 'SDE-2',
    company: 'Amazon',
    companyColor: '#FF9900',
    avatarInitials: 'RN',
    avatarUrl: '',
    quote: 'The company-wise problem bucket picker is a cheat code. Solved 150+ Amazon LP & DSA questions seamlessly without juggling Notion tables.',
    spotlightColor: 'rgba(255, 153, 0, 0.18)',
    rating: 5,
    userTag: 'TrackAsap User',
    isVerified: true,
    verifiedLabel: 'Verified Industry Engineer',
    order: 1,
    isActive: true,
  },
  {
    name: 'Kabir Verma',
    role: 'Senior Frontend Engineer',
    company: 'Atlassian',
    companyColor: '#0052CC',
    avatarInitials: 'KV',
    avatarUrl: '',
    quote: 'Having my LeetCode, CodeChef, and Codeforces heatmaps in one non-cluttered command center is incredible. Highly recommend to every engineer.',
    spotlightColor: 'rgba(0, 82, 204, 0.18)',
    rating: 5,
    userTag: 'TrackAsap User',
    isVerified: true,
    verifiedLabel: 'Verified Industry Engineer',
    order: 2,
    isActive: true,
  },
  {
    name: 'Sneha Gupta',
    role: 'Software Engineer',
    company: 'Microsoft',
    companyColor: '#00A4EF',
    avatarInitials: 'SG',
    avatarUrl: '',
    quote: 'The TrackEx Chrome extension auto-logs time spent on problems from link open to solved. It is the single best productivity enhancement for CP.',
    spotlightColor: 'rgba(0, 164, 239, 0.18)',
    rating: 5,
    userTag: 'TrackAsap User',
    isVerified: true,
    verifiedLabel: 'Verified Industry Engineer',
    order: 3,
    isActive: true,
  },
  {
    name: 'Dev Mehta',
    role: 'SDE-1',
    company: 'Flipkart',
    companyColor: '#2874F0',
    avatarInitials: 'DM',
    avatarUrl: '',
    quote: 'The 75-Day Challenge tracker and GitHub repo sync pushed my streak to 45 days. Absolutely essential for placement and coding round prep.',
    spotlightColor: 'rgba(40, 116, 240, 0.18)',
    rating: 5,
    userTag: 'TrackAsap User',
    isVerified: true,
    verifiedLabel: 'Verified Industry Engineer',
    order: 4,
    isActive: true,
  },
  {
    name: 'Ananya Iyer',
    role: 'Senior SWE',
    company: 'Uber',
    companyColor: '#10b981',
    avatarInitials: 'AI',
    avatarUrl: '',
    quote: 'No more scattered spreadsheets or lost notes. TrackAsap is the developer command center that every serious software engineer deserves.',
    spotlightColor: 'rgba(16, 185, 129, 0.18)',
    rating: 5,
    userTag: 'TrackAsap User',
    isVerified: true,
    verifiedLabel: 'Verified Industry Engineer',
    order: 5,
    isActive: true,
  },
];

const getInitials = (name) => {
  if (!name) return 'TA';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Ensure initial testimonials are seeded if collection is empty
 */
export const ensureSeeded = async () => {
  const count = await Testimonial.countDocuments();
  if (count === 0) {
    await Testimonial.insertMany(DEFAULT_TESTIMONIALS);
  }
};

/**
 * Public: Get active testimonials for Landing Page
 * GET /api/testimonials
 */
export const getPublicTestimonials = async (req, res) => {
  try {
    await ensureSeeded();
    const testimonials = await Testimonial.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    res.json(testimonials);
  } catch (error) {
    console.error('getPublicTestimonials error:', error);
    res.status(500).json({ message: 'Failed to fetch testimonials', error: error.message });
  }
};

/**
 * Admin: Get all testimonials (active & inactive)
 * GET /api/testimonials/admin
 */
export const getAdminTestimonials = async (req, res) => {
  try {
    await ensureSeeded();
    const testimonials = await Testimonial.find().sort({ order: 1, createdAt: 1 });
    res.json(testimonials);
  } catch (error) {
    console.error('getAdminTestimonials error:', error);
    res.status(500).json({ message: 'Failed to fetch admin testimonials', error: error.message });
  }
};

/**
 * Admin: Create a new testimonial
 * POST /api/testimonials
 */
export const createTestimonial = async (req, res) => {
  try {
    const {
      name,
      role,
      company,
      companyColor = '#4285F4',
      avatarUrl = '',
      avatarInitials = '',
      quote,
      rating = 5,
      isVerified = true,
      verifiedLabel = 'Verified Industry Engineer',
      userTag = 'TrackAsap User',
      spotlightColor = 'rgba(66, 133, 244, 0.18)',
      order = 0,
      isActive = true,
    } = req.body;

    if (!name || !role || !company || !quote) {
      return res.status(400).json({ message: 'Name, role, company, and quote are required' });
    }

    const initials = avatarInitials.trim() || getInitials(name);

    const testimonial = await Testimonial.create({
      name: name.trim(),
      role: role.trim(),
      company: company.trim(),
      companyColor: companyColor.trim(),
      avatarUrl: avatarUrl.trim(),
      avatarInitials: initials,
      quote: quote.trim(),
      rating: Number(rating) || 5,
      isVerified: Boolean(isVerified),
      verifiedLabel: verifiedLabel.trim() || 'Verified Industry Engineer',
      userTag: userTag.trim() || 'TrackAsap User',
      spotlightColor: spotlightColor.trim(),
      order: Number(order) || 0,
      isActive: Boolean(isActive),
    });

    res.status(201).json(testimonial);
  } catch (error) {
    console.error('createTestimonial error:', error);
    res.status(500).json({ message: 'Failed to create testimonial', error: error.message });
  }
};

/**
 * Admin: Update testimonial
 * PUT /api/testimonials/:id
 */
export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.name && !updateData.avatarInitials) {
      updateData.avatarInitials = getInitials(updateData.name);
    }

    const testimonial = await Testimonial.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    res.json(testimonial);
  } catch (error) {
    console.error('updateTestimonial error:', error);
    res.status(500).json({ message: 'Failed to update testimonial', error: error.message });
  }
};

/**
 * Admin: Delete testimonial
 * DELETE /api/testimonials/:id
 */
export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findByIdAndDelete(id);

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    res.json({ message: 'Testimonial deleted successfully', id });
  } catch (error) {
    console.error('deleteTestimonial error:', error);
    res.status(500).json({ message: 'Failed to delete testimonial', error: error.message });
  }
};

/**
 * Admin: Toggle active state
 * PUT /api/testimonials/:id/toggle
 */
export const toggleTestimonialActive = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    testimonial.isActive = !testimonial.isActive;
    await testimonial.save();

    res.json(testimonial);
  } catch (error) {
    console.error('toggleTestimonialActive error:', error);
    res.status(500).json({ message: 'Failed to toggle testimonial', error: error.message });
  }
};

/**
 * Admin: Reset / re-seed defaults
 * POST /api/testimonials/seed
 */
export const seedDefaultTestimonials = async (req, res) => {
  try {
    await Testimonial.deleteMany({});
    const inserted = await Testimonial.insertMany(DEFAULT_TESTIMONIALS);
    res.json({ message: 'Default testimonials restored successfully', count: inserted.length, testimonials: inserted });
  } catch (error) {
    console.error('seedDefaultTestimonials error:', error);
    res.status(500).json({ message: 'Failed to seed default testimonials', error: error.message });
  }
};

/**
 * Admin: Upload avatar image
 * POST /api/testimonials/upload-avatar
 */
export const uploadTestimonialAvatar = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    res.json({ url: req.file.path });
  } catch (error) {
    console.error('uploadTestimonialAvatar error:', error);
    res.status(500).json({ message: 'Failed to upload avatar', error: error.message });
  }
};
