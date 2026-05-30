// popup.js — TrackEx Popup (reads from chrome.storage.local)

const $ = (sel) => document.querySelector(sel);

const states = {
  loading: $('#loading-state'),
  connect: $('#connect-state'),
  dashboard: $('#dashboard-state'),
};

function showState(name) {
  Object.values(states).forEach(el => { if (el) el.classList.add('hidden'); });
  if (states[name]) states[name].classList.remove('hidden');
}

// ── Timer ─────────────────────────────────────────────────────
let timerInterval = null;

function startTimerDisplay(startTime) {
  clearInterval(timerInterval);
  const timerEl = $('#timer-display');
  if (!timerEl || !startTime) return;
  function update() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
  }
  update();
  timerInterval = setInterval(update, 1000);
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

// ── Show active problem ───────────────────────────────────────
function showProblem(info) {
  if (!info || !info.slug) return;
  const title = info.title || info.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const pn = $('#current-problem-name'); if (pn) pn.textContent = title;
  const df = $('#current-problem-diff');
  if (df) {
    const d = (info.difficulty || 'medium').toLowerCase();
    df.textContent = d.charAt(0).toUpperCase() + d.slice(1);
    df.className = `diff-badge diff-${d}`;
  }
  const at = $('#current-attempts');
  if (at) {
    if (info.attempts > 0) { at.textContent = `${info.attempts} attempt${info.attempts > 1 ? 's' : ''}`; at.classList.remove('hidden'); }
    else at.classList.add('hidden');
  }

  const ap = $('#active-problem'); if (ap) ap.classList.remove('hidden');
  const nap = $('#no-active-problem'); if (nap) nap.classList.add('hidden');

  if (info.startTime) startTimerDisplay(info.startTime);

  // Load notes
  chrome.storage.local.get([`trackex_notes_${info.slug}`], (data) => {
    const ni = $('#notes-input');
    if (ni) ni.value = data[`trackex_notes_${info.slug}`] || '';
  });
}

// ── Query active tab ──────────────────────────────────────────
function queryActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs?.[0]?.url?.includes('leetcode.com/problems/')) {
      // Not on LC — try reading stored problem info
      chrome.storage.local.get(['trackex_current_problem', 'trackex_current_slug', 'trackex_current_timer'], (data) => {
        if (data.trackex_current_slug) {
          showProblem({
            ...(data.trackex_current_problem || {}),
            slug: data.trackex_current_slug,
            startTime: data.trackex_current_timer,
          });
        }
      });
      return;
    }

    // Ask content script directly
    chrome.tabs.sendMessage(tabs[0].id, { type: 'TRACKEX_GET_PROBLEM_STATE' }, (resp) => {
      if (chrome.runtime.lastError || !resp?.slug) {
        // Fallback to storage
        chrome.storage.local.get(['trackex_current_problem', 'trackex_current_slug', 'trackex_current_timer'], (data) => {
          if (data.trackex_current_slug) {
            showProblem({
              ...(data.trackex_current_problem || {}),
              slug: data.trackex_current_slug,
              startTime: data.trackex_current_timer,
            });
          }
        });
        return;
      }
      showProblem(resp);
    });
  });
}

// ── Dashboard ─────────────────────────────────────────────────
function renderDashboard(state) {
  if (state.user) {
    const n = $('#user-name'); if (n) n.textContent = state.user.name || 'User';
    const e = $('#user-email'); if (e) e.textContent = state.user.email || '';
    const a = $('#user-avatar'); if (a) a.textContent = (state.user.name || 'U').charAt(0).toUpperCase();
  }
  const badge = $('#auto-badge');
  if (badge) badge.classList.toggle('hidden', !state.autoConnected);

  const se = $('#stat-synced'); if (se) se.textContent = (state.recent || []).length;
  const qe = $('#stat-queued'); if (qe) qe.textContent = state.queueLength || 0;
  const de = $('#connection-dot'); if (de) de.className = state.isAuthenticated ? 'status-dot' : 'status-dot offline';

  const recentEl = $('#recent-list');
  const recent = state.recent || [];
  if (recentEl) {
    if (recent.length === 0) {
      recentEl.innerHTML = '<p class="muted-text" style="padding: 8px 0;">Solve a problem and it appears here ✨</p>';
    } else {
      recentEl.innerHTML = recent.map(r => {
        const isAC = r.result === 'Accepted';
        return `<div class="recent-item"><span class="recent-title">${escapeHtml(r.title)}</span><div class="recent-meta">${r.runtime ? `<span class="recent-runtime">${escapeHtml(r.runtime)}</span>` : ''}<span class="recent-result ${isAC ? 'result-accepted' : 'result-wrong'}">${isAC ? '✓ AC' : '✗ WA'}</span></div></div>`;
      }).join('');
    }
  }

  showState('dashboard');
  setTimeout(queryActiveTab, 200);
}

// ── Init ──────────────────────────────────────────────────────
function init() {
  showState('loading');
  setTimeout(() => {
    try {
      chrome.runtime.sendMessage({ type: 'TRACKEX_GET_STATE' }, (state) => {
        if (chrome.runtime.lastError || !state) { showState('connect'); return; }
        if (state.isAuthenticated && state.user) {
          renderDashboard(state);
        } else {
          chrome.runtime.sendMessage({ type: 'TRACKEX_AUTO_DETECT' }, (result) => {
            if (result?.success) {
              chrome.runtime.sendMessage({ type: 'TRACKEX_GET_STATE' }, (ns) => {
                if (ns?.isAuthenticated) renderDashboard(ns);
                else showState('connect');
              });
            } else showState('connect');
          });
        }
      });
    } catch (_) { showState('connect'); }
  }, 300);
}

// ── Auto-detect button ────────────────────────────────────────
const detectBtn = $('#detect-btn');
if (detectBtn) detectBtn.addEventListener('click', () => {
  const btnText = $('#detect-btn-text');
  const statusEl = $('#detect-status');
  detectBtn.classList.add('detecting');
  if (btnText) btnText.textContent = 'Searching...';
  chrome.runtime.sendMessage({ type: 'TRACKEX_AUTO_DETECT' }, (result) => {
    detectBtn.classList.remove('detecting');
    if (result?.success) {
      if (btnText) btnText.textContent = 'Connected!';
      if (statusEl) { statusEl.textContent = '✅ Found your session!'; statusEl.className = 'connect-status status-info'; statusEl.classList.remove('hidden'); }
      setTimeout(init, 500);
    } else {
      if (btnText) btnText.textContent = 'Detect TrackAsap Login';
      if (statusEl) { statusEl.textContent = 'No TrackAsap tab found. Open TrackAsap and log in first!'; statusEl.className = 'connect-status status-error'; statusEl.classList.remove('hidden'); }
    }
  });
});

// ── Open TrackAsap ────────────────────────────────────────────
const openBtn = $('#open-trackasap-btn');
if (openBtn) openBtn.addEventListener('click', () => chrome.tabs.create({ url: 'http://localhost:3000' }));

// ── Manual login ──────────────────────────────────────────────
const mt = $('#manual-toggle');
const mw = $('#manual-form-wrap');
if (mt && mw) mt.addEventListener('click', () => {
  const h = mw.classList.contains('hidden');
  mw.classList.toggle('hidden');
  mt.textContent = h ? 'hide manual login ▴' : 'or sign in manually ▾';
});

const lf = $('#login-form');
if (lf) lf.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = ($('#email')?.value || '').trim();
  const pass = $('#password')?.value || '';
  const api = ($('#api-url')?.value || '').trim() || 'http://localhost:5000';
  const err = $('#login-error');
  const bt = $('#login-btn-text');
  const bs = $('#login-spinner');
  if (err) err.classList.add('hidden');
  if (bt) bt.textContent = 'Signing in...';
  if (bs) bs.classList.remove('hidden');
  chrome.runtime.sendMessage({ type: 'TRACKEX_LOGIN', payload: { email, password: pass, apiUrl: api } }, (r) => {
    if (bt) bt.textContent = 'Sign In';
    if (bs) bs.classList.add('hidden');
    if (r?.success) init();
    else if (err) { err.textContent = r?.error || 'Login failed'; err.classList.remove('hidden'); }
  });
});

// ── Notes ─────────────────────────────────────────────────────
const nt = $('#notes-toggle');
const nw = $('#notes-wrap');
if (nt && nw) nt.addEventListener('click', () => {
  const h = nw.classList.contains('hidden');
  nw.classList.toggle('hidden');
  nt.classList.toggle('open', h);
  nt.innerHTML = h
    ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg> Notes'
    : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg> Hide Notes';
  if (h) $('#notes-input')?.focus();
});

let nst = null;
const ni = $('#notes-input');
if (ni) ni.addEventListener('input', () => {
  clearTimeout(nst);
  const sv = $('#notes-saved');
  if (sv) sv.classList.add('hidden');
  nst = setTimeout(() => {
    chrome.storage.local.get(['trackex_current_slug'], (d) => {
      const slug = d.trackex_current_slug;
      if (!slug) return;
      const notes = ni.value.trim();
      chrome.storage.local.set({ [`trackex_notes_${slug}`]: notes }, () => {
        if (sv && notes) { sv.classList.remove('hidden'); setTimeout(() => sv.classList.add('hidden'), 2000); }
      });
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs?.[0]?.url?.includes('leetcode.com'))
          chrome.tabs.sendMessage(tabs[0].id, { type: 'TRACKEX_SAVE_NOTES', notes }).catch(() => {});
      });
    });
  }, 500);
});

// ── Logout ────────────────────────────────────────────────────
const lb = $('#logout-btn');
if (lb) lb.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'TRACKEX_LOGOUT' }, () => {
    clearInterval(timerInterval);
    showState('connect');
  });
});

// ── Real-time updates ─────────────────────────────────────────
try {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'TRACKEX_PROBLEM_INFO') showProblem(msg.payload);
  });
} catch (_) {}

init();
