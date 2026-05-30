// auth-bridge.js — Runs on TrackAsap pages (localhost:3000 & track-asap.vercel.app)
// Auto-detects login and syncs JWT token to the extension.

(function () {
  'use strict';

  // Map frontend domain → backend API URL
  const API_MAP = {
    'localhost:3000': 'http://localhost:5000',
    'track-asap.vercel.app': '', // production uses /api relative path or onrender
  };

  function getApiUrl() {
    const host = window.location.host;
    if (host.includes('localhost')) return 'http://localhost:5000';
    // For production, try to detect from the page's environment or use a known URL
    // Read from the page's meta or config if available
    return ''; // Will be resolved later
  }

  function syncAuth() {
    try {
      const token = localStorage.getItem('token');
      const userRaw = localStorage.getItem('user');

      if (!token || !userRaw) {
        // User is not logged in — notify extension
        chrome.runtime.sendMessage({
          type: 'TRACKEX_AUTH_BRIDGE',
          payload: { authenticated: false },
        }).catch(() => {});
        return;
      }

      const user = JSON.parse(userRaw);
      const apiUrl = getApiUrl();

      chrome.runtime.sendMessage({
        type: 'TRACKEX_AUTH_BRIDGE',
        payload: {
          authenticated: true,
          token,
          user: {
            name: user.name,
            email: user.email,
            _id: user._id,
          },
          apiUrl,
          source: window.location.host,
        },
      }).catch(() => {});

      console.log('[TrackEx] Auth bridge: synced token from', window.location.host);
    } catch (err) {
      console.warn('[TrackEx] Auth bridge error:', err.message);
    }
  }

  // Sync immediately on page load
  syncAuth();

  // Also watch for login/logout changes (localStorage changes)
  window.addEventListener('storage', (e) => {
    if (e.key === 'token' || e.key === 'user') {
      console.log('[TrackEx] Auth bridge: detected localStorage change');
      setTimeout(syncAuth, 500); // Small delay for both keys to update
    }
  });

  // Also poll periodically in case the storage event doesn't fire
  // (storage event doesn't fire for changes in the same tab)
  let lastToken = localStorage.getItem('token');
  setInterval(() => {
    const currentToken = localStorage.getItem('token');
    if (currentToken !== lastToken) {
      lastToken = currentToken;
      syncAuth();
    }
  }, 3000);

  console.log('[TrackEx] Auth bridge loaded on:', window.location.host);
})();
