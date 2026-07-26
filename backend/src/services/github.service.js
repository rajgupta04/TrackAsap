import crypto from 'crypto';

const GITHUB_API = 'https://api.github.com';
export const REPO_NAME = 'TrackAsap-Activity';

function normalizePrivateKey(raw) {
  return String(raw || '').replace(/\\n/g, '\n').trim();
}

/**
 * Build a short-lived JWT for GitHub App authentication.
 */
export function createGitHubAppJwt() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = normalizePrivateKey(process.env.GITHUB_APP_PRIVATE_KEY);

  if (!appId || !privateKey) {
    throw new Error('GitHub App is not configured');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iat: now - 60,
    exp: now + 9 * 60,
    iss: appId,
  };

  const encode = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const unsigned = `${encode(header)}.${encode(payload)}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();

  const signature = signer
    .sign(privateKey, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${unsigned}.${signature}`;
}

/**
 * Fetch an installation access token for GitHub App mode.
 */
export async function getInstallationAccessToken(installationId) {
  const jwt = createGitHubAppJwt();
  const res = await fetch(`${GITHUB_API}/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create installation access token');
  }
  return data;
}

/**
 * Fetch installation metadata.
 */
export async function getInstallation(installationId) {
  const jwt = createGitHubAppJwt();
  const res = await fetch(`${GITHUB_API}/app/installations/${installationId}`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/vnd.github+json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch installation');
  }
  return data;
}

/**
 * List repositories accessible by an installation token.
 */
export async function listInstallationRepositories(installationToken) {
  const res = await fetch(`${GITHUB_API}/installation/repositories`, {
    headers: {
      Authorization: `Bearer ${installationToken}`,
      Accept: 'application/vnd.github+json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to list installation repositories');
  }
  return data.repositories || [];
}

/**
 * Exchange OAuth code for an access token.
 */
export async function exchangeCodeForToken(code) {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }
  return data.access_token;
}

/**
 * Fetch the authenticated GitHub user's profile.
 */
export async function getGitHubUser(token) {
  const res = await fetch(`${GITHUB_API}/user`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch GitHub user');
  return res.json();
}

/**
 * Fetch authenticated GitHub user emails.
 */
export async function getGitHubUserEmails(token) {
  const res = await fetch(`${GITHUB_API}/user/emails`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch GitHub emails');
  return res.json();
}

/**
 * Get the best email to use for login/linking.
 */
export async function getGitHubPrimaryEmail(token) {
  const emails = await getGitHubUserEmails(token);
  const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified) || emails[0];
  return primary?.email || '';
}

/**
 * Ensure the "TrackAsap-Activity" repo exists under the user's account.
 * Creates it if it doesn't exist. Returns the repo object.
 */
export async function ensureRepo(token, username, options = {}) {
  const owner = options.owner || username;
  const repoName = options.repoName || REPO_NAME;
  const canCreate = options.canCreate !== false;

  // Check if repo exists
  const check = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  if (check.ok) return check.json();

  if (check.status === 404 && canCreate) {
    // Create the repo
    const create = await fetch(`${GITHUB_API}/user/repos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description:
          'My DSA problem solutions & notes — auto-synced from TrackAsap',
        private: true,
        auto_init: true,
      }),
    });

    if (!create.ok) {
      const err = await create.json();
      throw new Error(err.message || 'Failed to create repo');
    }
    return create.json();
  }

  if (check.status === 404 && !canCreate) {
    throw new Error(`Repository ${owner}/${repoName} not found or not accessible by installation`);
  }

  throw new Error('Failed to check repo existence');
}

// ─── Language → file extension map ───────────────────────────────────────
const EXT_MAP = {
  cpp: '.cpp',
  java: '.java',
  python: '.py',
  javascript: '.js',
  c: '.c',
  go: '.go',
  rust: '.rs',
  other: '.txt',
};

/**
 * Sanitize a string for use as a file/folder name.
 */
function sanitize(name) {
  return name
    .replace(/[<>:"/\\|?*]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

/**
 * Build the list of { path, content } objects from user's problems.
 *
 * @param {Array} sheetProblems  - SheetProblem docs (populated with sheet name)
 * @param {Array} standaloneProblems - Problem docs that have no sheetProblem ref
 * @param {string} username - GitHub username (for README)
 */
export function buildFileTree(sheetProblems, standaloneProblems, username, lastSyncDate) {
  const files = [];
  const seen = new Set();
  let recentFilesCount = 0;
  const recentTitles = [];

  const addFile = (path, content, isRecent) => {
    if (!content || !content.trim()) return;
    let finalPath = path;
    let counter = 1;
    while (seen.has(finalPath)) {
      const dot = path.lastIndexOf('.');
      finalPath =
        dot > 0
          ? `${path.slice(0, dot)}-${counter}${path.slice(dot)}`
          : `${path}-${counter}`;
      counter++;
    }
    seen.add(finalPath);
    files.push({ path: finalPath, content });
    if (isRecent) recentFilesCount++;
  };

  const isDocRecent = (doc) => {
    if (!lastSyncDate) return true;
    const updateTime = new Date(doc.updatedAt || doc.solvedAt || doc.createdAt).getTime();
    return updateTime > new Date(lastSyncDate).getTime();
  };

  // Sheet problems → sheets/{sheetName}/{topic}/{title}.ext
  for (const sp of sheetProblems) {
    const sheetName = sanitize(sp._sheetName || 'Unknown-Sheet');
    const topic = sanitize(sp.topic || 'General');
    const title = sanitize(sp.title);
    const base = `sheets/${sheetName}/${topic}/${title}`;
    const isRecent = isDocRecent(sp);
    if (isRecent) recentTitles.push(sp.title);

    if (sp.solutions && sp.solutions.length > 0) {
      sp.solutions.forEach((sol, idx) => {
        if (!sol.code) return;
        const ext = EXT_MAP[sol.language] || '.txt';
        const label = sp.solutions.length > 1 ? `_${sanitize(sol.label || `Approach-${idx + 1}`)}` : '';
        addFile(`${base}${label}${ext}`, sol.code, isRecent);
      });
    } else if (sp.code) {
      const ext = EXT_MAP[sp.language] || '.txt';
      addFile(`${base}${ext}`, sp.code, isRecent);
    }

    if (sp.notes) addFile(`${base}.notes.md`, `# ${sp.title}\n\n${sp.notes}`, isRecent);
  }

  // Standalone problems → problems/{platform}/{title}.ext
  for (const p of standaloneProblems) {
    const platform = sanitize(p.platform || 'other');
    const title = sanitize(p.title);
    const base = `problems/${platform}/${title}`;
    const isRecent = isDocRecent(p);
    if (isRecent) recentTitles.push(p.title);

    if (p.solutions && p.solutions.length > 0) {
      p.solutions.forEach((sol, idx) => {
        if (!sol.code) return;
        const ext = EXT_MAP[sol.language] || '.txt';
        const label = p.solutions.length > 1 ? `_${sanitize(sol.label || `Approach-${idx + 1}`)}` : '';
        addFile(`${base}${label}${ext}`, sol.code, isRecent);
      });
    } else if (p.code) {
      const ext = EXT_MAP[p.language] || '.txt';
      addFile(`${base}${ext}`, p.code, isRecent);
    }

    if (p.notes) addFile(`${base}.notes.md`, `# ${p.title}\n\n${p.notes}`, isRecent);
  }

  // README
  const totalCode =
    sheetProblems.filter((p) => p.code || (p.solutions && p.solutions.some(s => s.code))).length +
    standaloneProblems.filter((p) => p.code || (p.solutions && p.solutions.some(s => s.code))).length;
  const totalNotes =
    sheetProblems.filter((p) => p.notes).length +
    standaloneProblems.filter((p) => p.notes).length;

  const readme = [
    `# TrackAsap — ${username}'s Solutions`,
    '',
    `> Auto-synced from [TrackAsap](https://track-asap.vercel.app)`,
    '',
    `| Metric | Count |`,
    `| ------ | ----- |`,
    `| Code files | ${totalCode} |`,
    `| Notes | ${totalNotes} |`,
    `| Sheet problems | ${sheetProblems.length} |`,
    `| Standalone problems | ${standaloneProblems.length} |`,
    `| Last synced | ${new Date().toISOString().split('T')[0]} |`,
    '',
    '---',
    '',
    '*This repo is automatically managed by TrackAsap. Manual edits may be overwritten on next sync.*',
  ].join('\n');

  addFile('README.md', readme, false);

  const uniqueRecentTitles = Array.from(new Set(recentTitles));

  return {
    files,
    recentFilesCount,
    recentTitles: uniqueRecentTitles,
  };
}

/**
 * Push multiple files to the repo in a single commit using the Git Data API.
 *
 * Flow: get HEAD ref → get base tree → create blobs → create new tree → create commit → update ref
 */
export async function pushFiles(token, username, files, message, repoName = REPO_NAME) {
  const repo = `${username}/${repoName}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const gh = async (path, opts = {}) => {
    const res = await fetch(`${GITHUB_API}${path}`, { headers, ...opts });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub API ${res.status}: ${body}`);
    }
    return res.json();
  };

  // 1. Get HEAD reference
  const ref = await gh(`/repos/${repo}/git/ref/heads/main`);
  const baseSha = ref.object.sha;

  // 2. Get base commit's tree
  const baseCommit = await gh(`/repos/${repo}/git/commits/${baseSha}`);
  const baseTreeSha = baseCommit.tree.sha;

  // 3. Create blobs for all files
  const treeItems = await Promise.all(
    files.map(async (f) => {
      const blob = await gh(`/repos/${repo}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({
          content: f.content,
          encoding: 'utf-8',
        }),
      });
      return {
        path: f.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      };
    })
  );

  // 4. Create new tree
  const newTree = await gh(`/repos/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems,
    }),
  });

  // 5. Create commit
  const newCommit = await gh(`/repos/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: newTree.sha,
      parents: [baseSha],
    }),
  });

  // 6. Update HEAD reference
  await gh(`/repos/${repo}/git/refs/heads/main`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.sha }),
  });

  return { commitSha: newCommit.sha, filesCount: files.length };
}
