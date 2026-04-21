import User from '../models/User.model.js';
import { generateToken } from '../middleware/auth.middleware.js';
import { OAuth2Client } from 'google-auth-library';
import { exchangeCodeForToken, getGitHubUser, getGitHubPrimaryEmail } from '../services/github.service.js';

const getGoogleClientId = () => process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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
      });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      startDate: user.startDate,
      avatarUrl,
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

// @desc    Get GitHub OAuth URL for login
// @route   GET /api/auth/github/auth-url
// @access  Public
export const githubAuthUrl = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ message: 'GitHub OAuth is not configured on server' });
  }

  const backendBase = (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`)
    .replace(/\/+$/, '');
  const redirectUri =
    process.env.GITHUB_AUTH_REDIRECT_URI || `${backendBase}/api/auth/github/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email repo',
  });

  res.json({
    url: `https://github.com/login/oauth/authorize?${params.toString()}`,
  });
};

// @desc    Handle GitHub OAuth callback for login
// @route   GET /api/auth/github/callback
// @access  Public
export const githubCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${FRONTEND_URL}/login?github=error&reason=missing_code`);
    }

    const accessToken = await exchangeCodeForToken(code);
    const ghUser = await getGitHubUser(accessToken);
    const email = await getGitHubPrimaryEmail(accessToken);

    if (!email) {
      return res.redirect(`${FRONTEND_URL}/login?github=error&reason=missing_email`);
    }

    let user = await User.findOne({ githubId: String(ghUser.id) });
    if (!user) {
      user = await User.findOne({ email });
    }

    if (!user) {
      const randomPassword = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      user = await User.create({
        name: ghUser.name || ghUser.login || email.split('@')[0],
        email,
        password: randomPassword,
        startDate: new Date(),
        githubId: String(ghUser.id),
        githubUsername: ghUser.login || '',
        githubConnected: true,
        githubAccessToken: accessToken,
      });
    } else {
      user.githubId = user.githubId || String(ghUser.id);
      user.githubUsername = ghUser.login || user.githubUsername;
      user.githubConnected = true;
      user.githubAccessToken = accessToken;
      await user.save();
    }

    const token = generateToken(user._id);
    const avatarUrl = ghUser.avatar_url || '';
    const redirectUrl = `${FRONTEND_URL}/login#token=${encodeURIComponent(token)}&avatarUrl=${encodeURIComponent(avatarUrl)}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('GitHub auth error:', error.message);
    return res.redirect(`${FRONTEND_URL}/login?github=error&reason=auth_failed`);
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
      githubConnected: user.githubConnected,
      githubUsername: user.githubUsername,
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
      githubConnected: user.githubConnected,
      githubUsername: user.githubUsername,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
