import SystemSettings from '../models/SystemSettings.model.js';
import { compilerConfig } from './compiler.controller.js';

/**
 * Helper to get or initialize system settings
 */
export const getOrInitSettings = async () => {
  let settings = await SystemSettings.findOne({ key: 'main_settings' });
  if (!settings) {
    settings = await SystemSettings.create({
      key: 'main_settings',
      showProblems: false,
      showLeaderboard: false,
      compilerEnabled: compilerConfig.enabled ?? true,
      compilerMaxRunsPerMinute: compilerConfig.maxRunsPerMinute ?? 15,
    });
  }
  return settings;
};

/**
 * Public feature flags (for frontend navbar & routing)
 * GET /api/features
 */
export const getPublicFeatures = async (req, res) => {
  try {
    const settings = await getOrInitSettings();
    res.json({
      showProblems: settings.showProblems,
      showLeaderboard: settings.showLeaderboard,
      compilerEnabled: settings.compilerEnabled,
    });
  } catch (error) {
    console.error('getPublicFeatures error:', error);
    // Safe fallback defaults
    res.json({
      showProblems: false,
      showLeaderboard: false,
      compilerEnabled: true,
    });
  }
};

/**
 * Admin get all feature settings
 * GET /api/admin/features
 */
export const getAdminFeatures = async (req, res) => {
  try {
    const settings = await getOrInitSettings();
    res.json(settings);
  } catch (error) {
    console.error('getAdminFeatures error:', error);
    res.status(500).json({ message: 'Failed to fetch feature settings' });
  }
};

/**
 * Admin update feature settings
 * PUT /api/admin/features
 */
export const updateAdminFeatures = async (req, res) => {
  try {
    const { showProblems, showLeaderboard, compilerEnabled, compilerMaxRunsPerMinute } = req.body;
    
    let settings = await getOrInitSettings();

    if (typeof showProblems === 'boolean') {
      settings.showProblems = showProblems;
    }
    if (typeof showLeaderboard === 'boolean') {
      settings.showLeaderboard = showLeaderboard;
    }
    if (typeof compilerEnabled === 'boolean') {
      settings.compilerEnabled = compilerEnabled;
      compilerConfig.enabled = compilerEnabled;
    }
    if (typeof compilerMaxRunsPerMinute === 'number' && compilerMaxRunsPerMinute > 0) {
      const sanitizedRate = Math.min(Math.max(1, compilerMaxRunsPerMinute), 120);
      settings.compilerMaxRunsPerMinute = sanitizedRate;
      compilerConfig.maxRunsPerMinute = sanitizedRate;
    }

    await settings.save();

    res.json({
      message: 'Feature switches updated successfully',
      settings,
    });
  } catch (error) {
    console.error('updateAdminFeatures error:', error);
    res.status(500).json({ message: 'Failed to update feature switches' });
  }
};
