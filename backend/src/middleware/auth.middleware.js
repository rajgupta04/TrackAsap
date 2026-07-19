import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { AnalyticsTracker } from '../analytics/services/eventTracker.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (req.user.isBanned) {
        AnalyticsTracker.trackSecurity('ACCOUNT_LOCK', {
          user: req.user._id,
          req,
          details: { reason: 'User tried to access while banned' }
        });
        return res.status(403).json({
          message: 'Your account has been banned due to violation of community terms',
          banned: true,
        });
      }

      // Track active session (non-blocking)
      AnalyticsTracker.trackSession({ user: req.user, req });

      next();
    } catch (error) {
      console.error('Auth error:', error);
      AnalyticsTracker.trackSecurity('JWT_INVALID', { req, details: { error: error.message } });
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};
