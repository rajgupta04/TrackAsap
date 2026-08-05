import User from '../models/User.model.js';
import { generateToken } from '../middleware/auth.middleware.js';
import { OAuth2Client } from 'google-auth-library';
import { sendWelcomeEmail, sendResetPasswordEmail } from '../utils/mailer.js';
import crypto from 'crypto';

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
      authProvider: 'local',
      isEmailVerified: false,
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
      isEmailVerified: user.isEmailVerified,
      authProvider: user.authProvider,
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
      isEmailVerified: user.isEmailVerified,
      authProvider: user.authProvider,
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
        authProvider: 'google',
        isEmailVerified: true,
        welcomeEmailSent: true,
      });
      
      try {
        await sendWelcomeEmail(user);
      } catch (err) {
        console.error('Welcome email failed:', err);
      }
    } else {
      // Update googlePicture if missing or changed
      if (avatarUrl && user.googlePicture !== avatarUrl) {
        user.googlePicture = avatarUrl;
      }
      
      if (!user.welcomeEmailSent) {
        try {
          await sendWelcomeEmail(user);
          user.welcomeEmailSent = true;
        } catch (err) {
          console.error('Welcome email failed:', err);
        }
      }
      
      await user.save();
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
      isEmailVerified: user.isEmailVerified,
      authProvider: user.authProvider,
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
      isEmailVerified: user.isEmailVerified,
      authProvider: user.authProvider,
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
      isEmailVerified: user.isEmailVerified,
      authProvider: user.authProvider,
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

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No user registered with this email address.' });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({ message: 'Google accounts do not have a password to reset. Please sign in via Google.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    
    await user.save({ validateBeforeSave: false });

    await sendResetPasswordEmail(user, resetToken);

    res.json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ message: 'Password reset link is invalid or has expired.' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
