import crypto from 'crypto';
import User from '../models/User.model.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../utils/mailer.js';

// POST /api/email/send-verification (protected)
export const sendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
    user.emailVerificationExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    // Send email
    await sendVerificationEmail(user, token);

    res.json({ message: 'Verification email sent successfully.' });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ message: 'Failed to send verification email.' });
  }
};

// GET /api/email/verify/:token (public)
export const verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Send welcome email if not already sent
    if (!user.welcomeEmailSent) {
      try {
        await sendWelcomeEmail(user);
        user.welcomeEmailSent = true;
        await user.save({ validateBeforeSave: false });
      } catch (emailErr) {
        console.error('Welcome email failed:', emailErr);
        // Don't fail verification just because welcome email failed
      }
    }

    res.json({ message: 'Email verified successfully!' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Email verification failed.' });
  }
};
