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
      });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      startDate: user.startDate,
      codeforcesHandle: user.codeforcesHandle,
      codechefHandle: user.codechefHandle,
      leetcodeHandle: user.leetcodeHandle,
      targetWeight: user.targetWeight,
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
      startDate,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (codeforcesHandle !== undefined) user.codeforcesHandle = codeforcesHandle;
    if (codechefHandle !== undefined) user.codechefHandle = codechefHandle;
    if (leetcodeHandle !== undefined) user.leetcodeHandle = leetcodeHandle;
    if (targetWeight !== undefined) user.targetWeight = targetWeight;
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
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
