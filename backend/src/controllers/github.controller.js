import crypto from 'crypto';
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
  REPO_NAME,
  getInstallationAccessToken,
  getInstallation,
  listInstallationRepositories,
} from '../services/github.service.js';
import {
  decryptText,
  encryptText,
  isTokenEncryptionConfigured,
} from '../utils/crypto.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const GITHUB_USERNAME_REGEX = /^([A-Za-z\d](?:[A-Za-z\d-]{0,37}[A-Za-z\d])?)$/;
const GITHUB_AUTH_MODE = (process.env.GITHUB_AUTH_MODE || 'oauth').toLowerCase();

const hashState = (value) =>
  crypto.createHash('sha256').update(value).digest('hex');

const redirectWithReason = (res, reason) => {
  const allowed = new Set([
    'missing_params',
    'invalid_state',
    'invalid_github_user',
    'callback_failed',
  ]);
  const safeReason = allowed.has(reason) ? reason : 'callback_failed';
  return res.redirect(`${FRONTEND_URL}/profile?github=error&reason=${safeReason}`);
};

const getUserGitHubToken = (user) => {
  if (
    user.githubAccessTokenEnc &&
    user.githubAccessTokenIv &&
    user.githubAccessTokenTag
  ) {
    return decryptText({
      encrypted: user.githubAccessTokenEnc,
      iv: user.githubAccessTokenIv,
      tag: user.githubAccessTokenTag,
    });
  }

  return user.githubAccessToken || '';
};

const buildTokenUpdate = (token) => {
  if (isTokenEncryptionConfigured()) {
    const { encrypted, iv, tag } = encryptText(token);
    return {
      githubAccessTokenEnc: encrypted,
      githubAccessTokenIv: iv,
      githubAccessTokenTag: tag,
      githubAccessToken: '',
    };
  }

  // Backward-compatible fallback for environments that have not set encryption key yet.
  return {
    githubAccessToken: token,
  };
};

const getUserGitHubAuthMode = (user) => {
  if (user.githubAuthMode === 'app' || GITHUB_AUTH_MODE === 'app') {
    return 'app';
  }
  return 'oauth';
};

const getAppInstallBaseUrl = () => {
  const slug = process.env.GITHUB_APP_SLUG;
  if (!slug) {
    throw new Error('GitHub App slug is not configured');
  }
  return `https://github.com/apps/${slug}/installations/new`;
};

// @desc    Get GitHub OAuth authorization URL
// @route   GET /api/github/auth-url
// @access  Private
export const getAuthUrl = async (req, res) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ message: 'GitHub OAuth is not configured' });
    }

    const backendBase = (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`)
      .replace(/\/+$/, '');
    const redirectUri =
      process.env.GITHUB_REDIRECT_URI || `${backendBase}/api/github/callback`;

    const rawState = crypto.randomBytes(32).toString('hex');
    const stateHash = hashState(rawState);
    const expiresAt = new Date(Date.now() + OAUTH_STATE_TTL_MS);

    await User.findByIdAndUpdate(req.user._id, {
      githubOAuthState: stateHash,
      githubOAuthStateExpiresAt: expiresAt,
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'repo',
      state: rawState,
    });

    res.json({
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to start GitHub OAuth flow' });
  }
};

// @desc    Get GitHub App installation URL
// @route   GET /api/github/app/install-url
// @access  Private
export const getAppInstallUrl = async (req, res) => {
  try {
    const rawState = crypto.randomBytes(32).toString('hex');
    const stateHash = hashState(rawState);
    const expiresAt = new Date(Date.now() + OAUTH_STATE_TTL_MS);

    await User.findByIdAndUpdate(req.user._id, {
      githubOAuthState: stateHash,
      githubOAuthStateExpiresAt: expiresAt,
    });

    const params = new URLSearchParams({ state: rawState });
    const installUrl = `${getAppInstallBaseUrl()}?${params.toString()}`;

    res.json({ url: installUrl });
  } catch (error) {
    res.status(500).json({ message: 'Failed to start GitHub App installation flow' });
  }
};

// @desc    Handle GitHub OAuth callback
// @route   GET /api/github/callback
// @access  Public (redirected from GitHub)
export const handleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return redirectWithReason(res, 'missing_params');
    }

    const stateHash = hashState(String(state));

    const user = await User.findOne({
      githubOAuthState: stateHash,
      githubOAuthStateExpiresAt: { $gt: new Date() },
    }).select('+githubAccessToken +githubOAuthState +githubOAuthStateExpiresAt');

    if (!user) {
      return redirectWithReason(res, 'invalid_state');
    }

    const accessToken = await exchangeCodeForToken(code);
    const ghUser = await getGitHubUser(accessToken);
    const githubUsername = String(ghUser?.login || '').trim();

    if (!GITHUB_USERNAME_REGEX.test(githubUsername)) {
      await User.findByIdAndUpdate(user._id, {
        githubOAuthState: '',
        githubOAuthStateExpiresAt: null,
      });
      return redirectWithReason(res, 'invalid_github_user');
    }

    await User.findByIdAndUpdate(user._id, {
      ...buildTokenUpdate(accessToken),
      githubUsername,
      githubConnected: true,
      githubOAuthState: '',
      githubOAuthStateExpiresAt: null,
    });

    res.redirect(`${FRONTEND_URL}/profile?github=connected`);
  } catch (error) {
    console.error('GitHub callback error:', error.message);
    redirectWithReason(res, 'callback_failed');
  }
};

// @desc    Handle GitHub App installation callback
// @route   GET /api/github/app/callback
// @access  Public (redirected from GitHub)
export const handleAppCallback = async (req, res) => {
  try {
    const { installation_id: installationId, state } = req.query;
    if (!installationId || !state) {
      return redirectWithReason(res, 'missing_params');
    }

    const stateHash = hashState(String(state));
    const user = await User.findOne({
      githubOAuthState: stateHash,
      githubOAuthStateExpiresAt: { $gt: new Date() },
    }).select('+githubOAuthState +githubOAuthStateExpiresAt');

    if (!user) {
      return redirectWithReason(res, 'invalid_state');
    }

    const installation = await getInstallation(Number(installationId));
    const ownerLogin = String(installation?.account?.login || '').trim();
    if (!GITHUB_USERNAME_REGEX.test(ownerLogin)) {
      await User.findByIdAndUpdate(user._id, {
        githubOAuthState: '',
        githubOAuthStateExpiresAt: null,
      });
      return redirectWithReason(res, 'invalid_github_user');
    }

    const tokenData = await getInstallationAccessToken(Number(installationId));
    const repos = await listInstallationRepositories(tokenData.token);
    const targetRepo = repos.find((r) => r.name === REPO_NAME);

    if (!targetRepo) {
      await User.findByIdAndUpdate(user._id, {
        githubOAuthState: '',
        githubOAuthStateExpiresAt: null,
      });
      return redirectWithReason(res, 'callback_failed');
    }

    await User.findByIdAndUpdate(user._id, {
      githubConnected: true,
      githubAuthMode: 'app',
      githubInstallationId: Number(installationId),
      githubRepoOwner: ownerLogin,
      githubRepoName: targetRepo.name,
      githubUsername: ownerLogin,
      githubAccessToken: '',
      githubAccessTokenEnc: '',
      githubAccessTokenIv: '',
      githubAccessTokenTag: '',
      githubOAuthState: '',
      githubOAuthStateExpiresAt: null,
    });

    res.redirect(`${FRONTEND_URL}/profile?github=connected`);
  } catch (error) {
    console.error('GitHub App callback error:', error.message);
    redirectWithReason(res, 'callback_failed');
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
      authMode: user.githubAuthMode || 'oauth',
      repoOwner: user.githubRepoOwner || user.githubUsername || '',
      repoName: user.githubRepoName || REPO_NAME,
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
      githubAccessTokenEnc: '',
      githubAccessTokenIv: '',
      githubAccessTokenTag: '',
      githubUsername: '',
      githubConnected: false,
      githubAuthMode: 'oauth',
      githubInstallationId: null,
      githubRepoOwner: '',
      githubRepoName: '',
      lastGithubSync: null,
    });
    res.json({ message: 'GitHub disconnected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create/ensure GitHub repo exists
// @route   POST /api/github/init-repo
// @access  Private
export const initRepo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      '+githubAccessToken +githubAccessTokenEnc +githubAccessTokenIv +githubAccessTokenTag'
    );

    const authMode = getUserGitHubAuthMode(user);

    if (!user.githubConnected) {
      return res.status(400).json({ message: 'GitHub not connected. Please connect your account first.' });
    }

    let repo;
    let repoOwner = user.githubRepoOwner || user.githubUsername;
    let repoName = user.githubRepoName || REPO_NAME;

    if (authMode === 'app') {
      if (!user.githubInstallationId) {
        return res.status(400).json({ message: 'GitHub App is not installed for this account.' });
      }
      const tokenData = await getInstallationAccessToken(user.githubInstallationId);
      repo = await ensureRepo(tokenData.token, repoOwner, {
        owner: repoOwner,
        repoName,
        canCreate: false,
      });
    } else {
      const githubToken = getUserGitHubToken(user);
      if (!githubToken) {
        return res.status(400).json({ message: 'GitHub not connected. Please connect your account first.' });
      }
      repo = await ensureRepo(githubToken, user.githubUsername, { repoName: REPO_NAME });
      repoOwner = user.githubUsername;
      repoName = REPO_NAME;
    }

    res.json({
      success: true,
      repoUrl: repo.html_url || `https://github.com/${repoOwner}/${repoName}`,
    });
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
    const user = await User.findById(req.user._id).select(
      '+githubAccessToken +githubAccessTokenEnc +githubAccessTokenIv +githubAccessTokenTag'
    );

    if (!user.githubConnected) {
      return res.status(400).json({ message: 'GitHub not connected. Please connect your account first.' });
    }

    const authMode = getUserGitHubAuthMode(user);
    let githubToken = '';
    let repoOwner = user.githubRepoOwner || user.githubUsername;
    let repoName = user.githubRepoName || REPO_NAME;

    if (authMode === 'app') {
      if (!user.githubInstallationId) {
        return res.status(400).json({ message: 'GitHub App is not installed for this account.' });
      }
      const tokenData = await getInstallationAccessToken(user.githubInstallationId);
      githubToken = tokenData.token;
    } else {
      githubToken = getUserGitHubToken(user);
      repoOwner = user.githubUsername;
      repoName = REPO_NAME;
    }

    if (!githubToken) {
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
    await ensureRepo(githubToken, repoOwner, {
      owner: repoOwner,
      repoName,
      canCreate: authMode !== 'app',
    });

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
      githubToken,
      repoOwner,
      files,
      `sync: ${files.length - 1} files from TrackAsap — ${new Date().toISOString().split('T')[0]}`,
      repoName
    );

    // Update last sync time
    user.lastGithubSync = new Date();
    await user.save();

    res.json({
      success: true,
      filesCount: result.filesCount,
      commitSha: result.commitSha,
      repoUrl: `https://github.com/${repoOwner}/${repoName}`,
    });
  } catch (error) {
    console.error('GitHub sync error:', error.message);

    // If token is invalid, disconnect
    if (error.message?.includes('401') || error.message?.includes('Bad credentials')) {
      await User.findByIdAndUpdate(req.user._id, {
        githubAccessToken: '',
        githubAccessTokenEnc: '',
        githubAccessTokenIv: '',
        githubAccessTokenTag: '',
        githubUsername: '',
        githubConnected: false,
        githubAuthMode: 'oauth',
        githubInstallationId: null,
        githubRepoOwner: '',
        githubRepoName: '',
      });
      return res.status(401).json({
        message: 'GitHub token expired. Please reconnect your account.',
      });
    }

    res.status(500).json({ message: error.message });
  }
};
