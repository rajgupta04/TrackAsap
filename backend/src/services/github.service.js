const GITHUB_API = 'https://api.github.com';
const REPO_NAME = 'TrackAsap-Activity';

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
export async function ensureRepo(token, username) {
  // Check if repo exists
  const check = await fetch(`${GITHUB_API}/repos/${username}/${REPO_NAME}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  if (check.ok) return check.json();

  if (check.status === 404) {
    // Create the repo
    const create = await fetch(`${GITHUB_API}/user/repos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: REPO_NAME,
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
export function buildFileTree(sheetProblems, standaloneProblems, username) {
  const files = [];
  const seen = new Set();

  const addFile = (path, content) => {
    if (!content || !content.trim()) return;
    // Deduplicate paths
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
  };

  // Sheet problems → sheets/{sheetName}/{topic}/{title}.ext
  for (const sp of sheetProblems) {
    const sheetName = sanitize(sp._sheetName || 'Unknown-Sheet');
    const topic = sanitize(sp.topic || 'General');
    const title = sanitize(sp.title);
    const ext = EXT_MAP[sp.language] || '.txt';
    const base = `sheets/${sheetName}/${topic}/${title}`;

    if (sp.code) addFile(`${base}${ext}`, sp.code);
    if (sp.notes) addFile(`${base}.notes.md`, `# ${sp.title}\n\n${sp.notes}`);
  }

  // Standalone problems → problems/{platform}/{title}.ext
  for (const p of standaloneProblems) {
    const platform = sanitize(p.platform || 'other');
    const title = sanitize(p.title);
    const ext = EXT_MAP[p.language] || '.txt';
    const base = `problems/${platform}/${title}`;

    if (p.code) addFile(`${base}${ext}`, p.code);
    if (p.notes) addFile(`${base}.notes.md`, `# ${p.title}\n\n${p.notes}`);
  }

  // README
  const totalCode =
    sheetProblems.filter((p) => p.code).length +
    standaloneProblems.filter((p) => p.code).length;
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

  addFile('README.md', readme);

  return files;
}

/**
 * Push multiple files to the repo in a single commit using the Git Data API.
 *
 * Flow: get HEAD ref → get base tree → create blobs → create new tree → create commit → update ref
 */
export async function pushFiles(token, username, files, message) {
  const repo = `${username}/${REPO_NAME}`;
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
