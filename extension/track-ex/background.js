// background.js — Service Worker for TrackEx Chrome Extension
// Manages auth (auto-detected from TrackAsap), API sync, and offline queue

const DEFAULT_API_URL = 'http://localhost:5000';

// Known TrackAsap frontend → backend mappings
const DOMAIN_API_MAP = {
  'localhost:3000': 'http://localhost:5000',
  'track-asap.vercel.app': '', // Will try to detect
};

// ── Helpers ───────────────────────────────────────────────────

async function getStorage(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}

async function setStorage(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, resolve);
  });
}

async function getApiUrl() {
  const { trackex_api_url } = await getStorage(['trackex_api_url']);
  return trackex_api_url || DEFAULT_API_URL;
}

async function getToken() {
  const { trackex_token } = await getStorage(['trackex_token']);
  return trackex_token || null;
}

// ── API Calls ─────────────────────────────────────────────────

async function apiCall(method, path, body = null) {
  const apiUrl = await getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Not authenticated — open TrackAsap to auto-connect');
  }

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${apiUrl}/api/extension${path}`, options);

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `API error ${response.status}`);
  }

  return response.json();
}

// ── Auto-login from TrackAsap auth bridge ─────────────────────

async function handleAuthBridge(payload) {
  if (!payload.authenticated) {
    // User logged out of TrackAsap
    console.log('[TrackEx] Auth bridge: user logged out');
    return;
  }

  const { token, user, apiUrl, source } = payload;

  // Resolve API URL from source domain
  let resolvedApiUrl = apiUrl;
  if (!resolvedApiUrl && source) {
    resolvedApiUrl = DOMAIN_API_MAP[source] || DEFAULT_API_URL;
  }
  if (!resolvedApiUrl) resolvedApiUrl = DEFAULT_API_URL;

  // If the production frontend uses relative /api, we need to find the actual backend
  // For track-asap.vercel.app, try to detect by calling the API
  if (!resolvedApiUrl || resolvedApiUrl === '') {
    // Try common production API URLs
    const candidates = [
      `https://${source}/api`,
      DEFAULT_API_URL,
    ];
    for (const url of candidates) {
      try {
        const resp = await fetch(`${url}/extension/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          // Remove '/api' suffix if present since we add it in apiCall
          resolvedApiUrl = url.replace(/\/api$/, '');
          break;
        }
      } catch (_) {}
    }
    if (!resolvedApiUrl) resolvedApiUrl = DEFAULT_API_URL;
  }

  await setStorage({
    trackex_token: token,
    trackex_user: {
      name: user.name,
      email: user.email,
      _id: user._id,
    },
    trackex_api_url: resolvedApiUrl,
    trackex_auto_connected: true,
  });

  console.log('[TrackEx] Auto-connected from:', source, '→', resolvedApiUrl);
}

// ── Manual Login (fallback) ───────────────────────────────────

async function login(email, password, apiUrl) {
  const url = apiUrl || DEFAULT_API_URL;

  const response = await fetch(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Login failed');
  }

  const data = await response.json();

  await setStorage({
    trackex_token: data.token,
    trackex_user: {
      name: data.name,
      email: data.email,
      _id: data._id,
    },
    trackex_api_url: url,
    trackex_auto_connected: false,
  });

  return data;
}

async function logout() {
  await chrome.storage.local.remove([
    'trackex_token',
    'trackex_user',
    'trackex_api_url',
    'trackex_queue',
    'trackex_recent',
    'trackex_auto_connected',
  ]);
}

// ── Try auto-detect from open TrackAsap tabs ──────────────────

async function tryAutoDetect() {
  const token = await getToken();
  if (token) return true; // Already authenticated

  // Look for open TrackAsap tabs
  const trackAsapDomains = [
    'http://localhost:3000/*',
    'https://track-asap.vercel.app/*',
  ];

  for (const pattern of trackAsapDomains) {
    try {
      const tabs = await chrome.tabs.query({ url: pattern });
      if (tabs.length > 0) {
        const tab = tabs[0];
        // Inject script to read localStorage
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            return {
              token: localStorage.getItem('token'),
              user: localStorage.getItem('user'),
              host: window.location.host,
            };
          },
        });

        if (results && results[0] && results[0].result) {
          const { token: t, user: u, host } = results[0].result;
          if (t && u) {
            const parsedUser = JSON.parse(u);
            await handleAuthBridge({
              authenticated: true,
              token: t,
              user: parsedUser,
              source: host,
            });
            console.log('[TrackEx] Auto-detected login from tab:', host);
            return true;
          }
        }
      }
    } catch (err) {
      console.log('[TrackEx] Auto-detect failed for', pattern, err.message);
    }
  }

  return false;
}

// ── Submission Sync ───────────────────────────────────────────

async function syncSubmission(submission) {
  try {
    const result = await apiCall('POST', '/submit', submission);

    // Save to recent syncs
    const { trackex_recent = [] } = await getStorage(['trackex_recent']);
    const recent = [
      {
        title: submission.title,
        difficulty: submission.difficulty,
        result: submission.result,
        runtime: submission.runtime,
        timeSpent: submission.timeSpent,
        syncedAt: new Date().toISOString(),
      },
      ...trackex_recent,
    ].slice(0, 10);
    await setStorage({ trackex_recent: recent });

    return result;
  } catch (error) {
    // Queue for retry if offline
    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      await queueSubmission(submission);
    }
    throw error;
  }
}

async function queueSubmission(submission) {
  const { trackex_queue = [] } = await getStorage(['trackex_queue']);
  trackex_queue.push(submission);
  await setStorage({ trackex_queue });
}

async function processQueue() {
  const { trackex_queue = [] } = await getStorage(['trackex_queue']);
  if (trackex_queue.length === 0) return;

  const remaining = [];
  for (const submission of trackex_queue) {
    try {
      await apiCall('POST', '/submit', submission);
    } catch (_) {
      remaining.push(submission);
    }
  }
  await setStorage({ trackex_queue: remaining });
}

// ── Message Handler ───────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  switch (type) {
    case 'TRACKEX_AUTH_BRIDGE':
      handleAuthBridge(payload)
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'TRACKEX_SYNC_SUBMISSION':
      syncSubmission(payload)
        .then((result) => sendResponse({ success: true, result }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case 'TRACKEX_LOGIN':
      login(payload.email, payload.password, payload.apiUrl)
        .then((data) => sendResponse({ success: true, user: data }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case 'TRACKEX_LOGOUT':
      logout().then(() => sendResponse({ success: true }));
      return true;

    case 'TRACKEX_GET_STATE':
      getStorage([
        'trackex_user', 'trackex_token', 'trackex_recent', 'trackex_queue',
        'trackex_api_url', 'trackex_auto_connected',
        'trackex_current_timer', 'trackex_current_slug',
      ]).then((data) => {
        sendResponse({
          user: data.trackex_user || null,
          isAuthenticated: !!data.trackex_token,
          recent: data.trackex_recent || [],
          queueLength: (data.trackex_queue || []).length,
          apiUrl: data.trackex_api_url || DEFAULT_API_URL,
          autoConnected: data.trackex_auto_connected || false,
          timer: data.trackex_current_timer || null,
          currentSlug: data.trackex_current_slug || '',
        });
      });
      return true;

    case 'TRACKEX_AUTO_DETECT':
      tryAutoDetect()
        .then((found) => sendResponse({ success: found }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'TRACKEX_CHECK_AUTH':
      apiCall('GET', '/status')
        .then((data) => sendResponse({ success: true, ...data }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case 'TRACKEX_TIMER_START':
    case 'TRACKEX_PROBLEM_INFO':
      break;
  }
});

// ── Retry queue periodically ──────────────────────────────────
chrome.alarms.create('trackex_retry_queue', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'trackex_retry_queue') {
    processQueue();
  }
});

console.log('[TrackEx] Background service worker started');
