import User from '../models/User.model.js';
import { generateToken } from '../middleware/auth.middleware.js';

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
