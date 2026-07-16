import User from '../models/User.model.js';
import { generateToken } from '../middleware/auth.middleware.js';
import { OAuth2Client } from 'google-auth-library';

const getGoogleClientId = () => process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, startDate } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      startDate: startDate || new Date(),
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      startDate: user.startDate,
      isBanned: user.isBanned,
      acceptedDiscussionAgreement: user.acceptedDiscussionAgreement,
      enablePhysique: Boolean(user.enablePhysique),
      profilePicture: user.profilePicture,
      googlePicture: user.googlePicture,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      startDate: user.startDate,
      codeforcesHandle: user.codeforcesHandle,
      codechefHandle: user.codechefHandle,
      leetcodeHandle: user.leetcodeHandle,
      targetWeight: user.targetWeight,
      enablePhysique: Boolean(user.enablePhysique),
      isBanned: user.isBanned,
      acceptedDiscussionAgreement: user.acceptedDiscussionAgreement,
      profilePicture: user.profilePicture,
      googlePicture: user.googlePicture,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login/Register with Google
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res) => {
  try {
    const clientId = getGoogleClientId();

    if (!clientId) {
      return res.status(500).json({ message: 'Google OAuth is not configured on server' });
    }

    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Missing Google credential' });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const name = payload?.name;
    const avatarUrl = payload?.picture || '';

    if (!email) {
      return res.status(400).json({ message: 'Google token did not include email' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: randomPassword,
        startDate: new Date(),
        googlePicture: avatarUrl,
      });
    } else {
      // Update googlePicture if missing or changed
      if (avatarUrl && user.googlePicture !== avatarUrl) {
        user.googlePicture = avatarUrl;
        await user.save();
      }
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      startDate: user.startDate,
      profilePicture: user.profilePicture,
      googlePicture: user.googlePicture,
      codeforcesHandle: user.codeforcesHandle,
      codechefHandle: user.codechefHandle,
      leetcodeHandle: user.leetcodeHandle,
      targetWeight: user.targetWeight,
      enablePhysique: Boolean(user.enablePhysique),
      isBanned: user.isBanned,
      acceptedDiscussionAgreement: user.acceptedDiscussionAgreement,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Google auth error:', error.message);
    return res.status(401).json({ message: 'Google authentication failed' });
  }
};


// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      startDate: user.startDate,
      codeforcesHandle: user.codeforcesHandle,
      codechefHandle: user.codechefHandle,
      leetcodeHandle: user.leetcodeHandle,
      targetWeight: user.targetWeight,
      enablePhysique: Boolean(user.enablePhysique),
      githubConnected: user.githubConnected,
      githubUsername: user.githubUsername,
      isBanned: user.isBanned,
      acceptedDiscussionAgreement: user.acceptedDiscussionAgreement,
      profilePicture: user.profilePicture,
      googlePicture: user.googlePicture,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      codeforcesHandle,
      codechefHandle,
      leetcodeHandle,
      targetWeight,
      enablePhysique,
      startDate,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (codeforcesHandle !== undefined) user.codeforcesHandle = codeforcesHandle;
    if (codechefHandle !== undefined) user.codechefHandle = codechefHandle;
    if (leetcodeHandle !== undefined) user.leetcodeHandle = leetcodeHandle;
    if (targetWeight !== undefined) user.targetWeight = targetWeight;
    if (enablePhysique !== undefined) user.enablePhysique = enablePhysique;
    if (startDate) user.startDate = startDate;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      startDate: user.startDate,
      codeforcesHandle: user.codeforcesHandle,
      codechefHandle: user.codechefHandle,
      leetcodeHandle: user.leetcodeHandle,
      targetWeight: user.targetWeight,
      enablePhysique: Boolean(user.enablePhysique),
      githubConnected: user.githubConnected,
      githubUsername: user.githubUsername,
      isBanned: user.isBanned,
      acceptedDiscussionAgreement: user.acceptedDiscussionAgreement,
      profilePicture: user.profilePicture,
      googlePicture: user.googlePicture,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept discussion community agreement
// @route   PUT /api/auth/accept-agreement
// @access  Private
export const acceptAgreement = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.acceptedDiscussionAgreement) {
      return res.json({ message: 'Agreement already accepted' });
    }

    user.acceptedDiscussionAgreement = true;
    user.acceptedDiscussionAgreementAt = new Date();
    await user.save();

    res.json({
      message: 'Agreement accepted successfully',
      acceptedDiscussionAgreement: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload profile picture
// @route   PUT /api/auth/profile/picture
// @access  Private
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // The Cloudinary URL is automatically provided by multer-storage-cloudinary
    user.profilePicture = req.file.path;
    await user.save();

    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
