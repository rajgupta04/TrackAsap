import User from '../models/User.model.js';
import SheetProblem from '../models/SheetProblem.model.js';
import Sheet from '../models/Sheet.model.js';
import Problem from '../models/Problem.model.js';
import {
  exchangeCodeForToken,
  getGitHubUser,
  ensureRepo,
  buildFileTree,
  pushFiles,
} from '../services/github.service.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

// @desc    Get GitHub OAuth authorization URL
// @route   GET /api/github/auth-url
// @access  Private
export const getAuthUrl = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ message: 'GitHub OAuth is not configured' });
  }

  const redirectUri = `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}/api/github/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo',
    state: req.user._id.toString(), // we'll verify this in callback
  });

  res.json({
    url: `https://github.com/login/oauth/authorize?${params.toString()}`,
  });
};

// @desc    Handle GitHub OAuth callback
// @route   GET /api/github/callback
// @access  Public (redirected from GitHub)
export const handleCallback = async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.redirect(`${FRONTEND_URL}/profile?github=error&reason=missing_params`);
    }

    // Exchange code for token
    const accessToken = await exchangeCodeForToken(code);

    // Get GitHub username
    const ghUser = await getGitHubUser(accessToken);

    // Save to user
    await User.findByIdAndUpdate(userId, {
      githubAccessToken: accessToken,
      githubUsername: ghUser.login,
      githubConnected: true,
    });

    res.redirect(`${FRONTEND_URL}/profile?github=connected`);
  } catch (error) {
    console.error('GitHub callback error:', error.message);
    res.redirect(`${FRONTEND_URL}/profile?github=error&reason=${encodeURIComponent(error.message)}`);
  }
};

// @desc    Get GitHub connection status
// @route   GET /api/github/status
// @access  Private
export const getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      connected: user.githubConnected,
      username: user.githubUsername,
      lastSync: user.lastGithubSync,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Disconnect GitHub account
// @route   DELETE /api/github/disconnect
// @access  Private
export const disconnect = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      githubAccessToken: '',
      githubUsername: '',
      githubConnected: false,
      lastGithubSync: null,
    });
    res.json({ message: 'GitHub disconnected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sync all code & notes to GitHub
// @route   POST /api/github/sync
// @access  Private
export const syncToGitHub = async (req, res) => {
  try {
    // Fetch user with access token
    const user = await User.findById(req.user._id).select('+githubAccessToken');

    if (!user.githubConnected || !user.githubAccessToken) {
      return res.status(400).json({ message: 'GitHub not connected. Please connect your account first.' });
    }

    // Cooldown check
    if (user.lastGithubSync) {
      const elapsed = Date.now() - new Date(user.lastGithubSync).getTime();
      if (elapsed < SYNC_COOLDOWN_MS) {
        const remainingSec = Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          message: `Please wait ${remainingSec}s before syncing again`,
        });
      }
    }

    // Ensure repo exists
    await ensureRepo(user.githubAccessToken, user.githubUsername);

    // Fetch all sheet problems with sheet names
    const sheets = await Sheet.find({ user: user._id }).select('_id name');
    const sheetMap = {};
    for (const s of sheets) {
      sheetMap[s._id.toString()] = s.name;
    }

    const sheetProblems = await SheetProblem.find({ user: user._id });
    const enrichedSheetProblems = sheetProblems
      .filter((sp) => sp.code || sp.notes)
      .map((sp) => ({
        ...sp.toObject(),
        _sheetName: sheetMap[sp.sheet.toString()] || 'Unknown-Sheet',
      }));

    // Fetch standalone problems (those not linked to a sheetProblem)
    const standaloneProblems = await Problem.find({
      user: user._id,
      sheetProblem: { $exists: false },
    });
    const filteredStandalone = standaloneProblems.filter(
      (p) => p.code || p.notes
    );

    // Build file tree
    const files = buildFileTree(
      enrichedSheetProblems,
      filteredStandalone,
      user.githubUsername
    );

    if (files.length <= 1) {
      // Only README, no actual code/notes
      return res.status(400).json({
        message: 'No code or notes to sync. Solve some problems first!',
      });
    }

    // Push to GitHub in a single commit
    const result = await pushFiles(
      user.githubAccessToken,
      user.githubUsername,
      files,
      `sync: ${files.length - 1} files from TrackAsap — ${new Date().toISOString().split('T')[0]}`
    );

    // Update last sync time
    user.lastGithubSync = new Date();
    await user.save();

    res.json({
      success: true,
      filesCount: result.filesCount,
      commitSha: result.commitSha,
      repoUrl: `https://github.com/${user.githubUsername}/TrackAsap`,
    });
  } catch (error) {
    console.error('GitHub sync error:', error.message);

    // If token is invalid, disconnect
    if (error.message?.includes('401') || error.message?.includes('Bad credentials')) {
      await User.findByIdAndUpdate(req.user._id, {
        githubAccessToken: '',
        githubUsername: '',
        githubConnected: false,
      });
      return res.status(401).json({
        message: 'GitHub token expired. Please reconnect your account.',
      });
    }

    res.status(500).json({ message: error.message });
  }
};
