// content.js — Content script for leetcode.com/problems/*
// Uses DOM observation as PRIMARY detection + fetch intercept as bonus

(function () {
  'use strict';

  // ── State ───────────────────────────────────────────────────
  let problemMeta = null;
  let lastCode = '';
  let lastLang = '';
  let attempts = 0;
  let timerStart = 0;
  let currentSlug = '';
  let synced = false;

  function getSlugFromURL() {
    const m = window.location.pathname.match(/\/problems\/([^/]+)/);
    return m ? m[1] : '';
  }

  // ── Timer (use chrome.storage.local — more reliable) ────────
  function initTimer() {
    currentSlug = getSlugFromURL();
    if (!currentSlug) return;
    synced = false;

    const key = `trackex_timer_${currentSlug}`;
    chrome.storage.local.get([key], (data) => {
      if (data[key]) {
        timerStart = data[key];
        console.log('[TrackEx] ⏱ Resumed timer for', currentSlug, '— started', Math.round((Date.now() - timerStart) / 1000), 's ago');
      } else {
        timerStart = Date.now();
        chrome.storage.local.set({ [key]: timerStart });
        console.log('[TrackEx] ⏱ Started new timer for', currentSlug);
      }
      // Also store the current slug so popup can find it
      chrome.storage.local.set({ trackex_current_slug: currentSlug, trackex_current_timer: timerStart });
    });
  }

  function getElapsedMinutes() {
    if (!timerStart) return 0;
    return Math.round((Date.now() - timerStart) / 60000);
  }

  // ── Parse problem from DOM ──────────────────────────────────
  function parseProblemFromDOM() {
    const slug = getSlugFromURL();
    if (!slug) return null;

    // Title
    let title = '';
    for (const sel of [
      '[data-cy="question-title"]',
      'div[class*="text-title-large"]',
      'a[class*="mr-2"][href*="/problems/"]',
      'div[class*="flexlayout"] span.text-lg',
    ]) {
      const el = document.querySelector(sel);
      const t = el?.textContent?.trim();
      if (t && t.length > 2 && t.length < 200) { title = t; break; }
    }
    // Fallback: format slug
    if (!title) title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Difficulty
    let difficulty = 'medium';
    document.querySelectorAll('div, span').forEach(el => {
      if (el.children.length > 0) return;
      const t = el.textContent?.trim();
      if (t === 'Easy') difficulty = 'easy';
      else if (t === 'Medium') difficulty = 'medium';
      else if (t === 'Hard') difficulty = 'hard';
    });

    return { title, titleSlug: slug, difficulty, topicTags: [] };
  }

  // ── Read code from Monaco via inject.js (MAIN world) ────────
  function requestCodeFromMonaco() {
    return new Promise((resolve) => {
      // Set up one-time listener
      function handler(event) {
        if (event.source !== window) return;
        if (event.data?.type === 'TRACKEX_CODE_RESPONSE') {
          window.removeEventListener('message', handler);
          clearTimeout(timeout);
          resolve(event.data.payload);
        }
      }
      window.addEventListener('message', handler);
      // Ask inject.js for code
      window.postMessage({ type: 'TRACKEX_REQUEST_CODE' }, '*');
      // Timeout fallback after 1.5s
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler);
        console.log('[TrackEx] Monaco request timed out — using DOM fallback');
        // DOM fallback: only gets visible lines
        const lines = document.querySelectorAll('.view-lines .view-line');
        const code = lines.length > 0 ? Array.from(lines).map(l => l.textContent || '').join('\n') : '';
        resolve({ code, lang: '' });
      }, 1500);
    });
  }

  // ── Detect language ─────────────────────────────────────────
  function detectLang() {
    // The language selector button in LeetCode
    const btns = document.querySelectorAll('button, div[class*="select"]');
    for (const b of btns) {
      const t = (b.textContent || '').trim().toLowerCase();
      if (['c++', 'java', 'python', 'python3', 'javascript', 'typescript', 'go', 'rust', 'c', 'c#', 'kotlin', 'swift'].includes(t)) {
        return t;
      }
    }
    // Check the dropdown value
    const selItem = document.querySelector('.ant-select-selection-item, div[class*="ant-select"] span');
    if (selItem) {
      const t = selItem.textContent?.trim()?.toLowerCase();
      if (t) return t;
    }
    return 'java';
  }

  // ── Save problem info for popup ─────────────────────────────
  function saveProblemForPopup() {
    const meta = problemMeta || parseProblemFromDOM();
    if (!meta) return;
    chrome.storage.local.set({
      trackex_current_slug: currentSlug,
      trackex_current_timer: timerStart,
      trackex_current_problem: {
        title: meta.title,
        slug: meta.titleSlug || currentSlug,
        difficulty: meta.difficulty,
        startTime: timerStart,
        attempts: attempts,
      },
    });
  }

  // ── Listen for messages from inject.js ──────────────────────
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const { type, payload } = event.data || {};

    if (type === 'TRACKEX_PROBLEM_META' && payload) {
      problemMeta = payload;
      console.log('[TrackEx] Meta from interceptor:', payload.title);
      saveProblemForPopup();
    }
    if (type === 'TRACKEX_SUBMISSION_SENT' && payload) {
      attempts++;
      lastCode = payload.code || '';
      lastLang = payload.lang || '';
      console.log('[TrackEx] Code captured from interceptor, lang:', lastLang, 'len:', lastCode.length);
    }
    if (type === 'TRACKEX_SUBMISSION_RESULT' && payload) {
      console.log('[TrackEx] Result from interceptor:', payload.statusDisplay);
      if (payload.code) lastCode = payload.code;
      if (payload.lang) lastLang = payload.lang;
      if (!synced) {
        synced = true;
        syncSubmission(payload.statusDisplay, payload.runtime, payload.memory, payload.submissionId);
      }
    }
  });

  // ── Listen for popup queries ────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'TRACKEX_GET_PROBLEM_STATE') {
      const meta = problemMeta || parseProblemFromDOM();
      sendResponse({
        title: meta?.title || '',
        slug: meta?.titleSlug || currentSlug,
        difficulty: meta?.difficulty || '',
        startTime: timerStart,
        attempts: attempts,
      });
      return true;
    }
    if (msg.type === 'TRACKEX_SAVE_NOTES') {
      chrome.storage.local.set({ [`trackex_notes_${currentSlug}`]: msg.notes || '' });
      sendResponse({ success: true });
      return true;
    }
  });

  // ── Sync submission to backend ──────────────────────────────
  async function syncSubmission(resultText, runtime, memory, submissionId) {
    const meta = problemMeta || parseProblemFromDOM();
    if (!meta) { console.warn('[TrackEx] No meta — skipping sync'); return; }

    // If no code was captured by interceptor, request from Monaco API
    if (!lastCode) {
      console.log('[TrackEx] No code from interceptor — requesting from Monaco...');
      const monacoData = await requestCodeFromMonaco();
      if (monacoData.code) {
        lastCode = monacoData.code;
        console.log('[TrackEx] Got code from Monaco:', lastCode.length, 'chars');
      }
      if (monacoData.lang && !lastLang) lastLang = monacoData.lang;
    }
    if (!lastLang) lastLang = detectLang();

    const slug = meta.titleSlug || currentSlug;

    chrome.storage.local.get([`trackex_notes_${slug}`], (data) => {
      const notes = data[`trackex_notes_${slug}`] || '';

      const payload = {
        title: meta.title,
        slug,
        difficulty: meta.difficulty,
        tags: meta.topicTags || [],
        code: lastCode,
        language: lastLang || 'java',
        timeSpent: getElapsedMinutes(),
        result: resultText,
        runtime: runtime || '',
        memory: memory || '',
        attempts: attempts || 1,
        submissionId: submissionId || `ext-${Date.now()}`,
        problemLink: `https://leetcode.com/problems/${slug}/`,
        notes,
      };

      console.log('[TrackEx] 🚀 Syncing:', payload.title, '→', payload.result, '| time:', payload.timeSpent, 'min | code:', payload.code.length, 'chars');

      chrome.runtime.sendMessage({ type: 'TRACKEX_SYNC_SUBMISSION', payload }, (resp) => {
        if (chrome.runtime.lastError) {
          console.error('[TrackEx] Sync error:', chrome.runtime.lastError.message);
          return;
        }
        if (resp?.success) {
          console.log('[TrackEx] ✅ Synced!', resp.result?.action);
          chrome.storage.local.remove([`trackex_notes_${slug}`, `trackex_timer_${slug}`]);
        } else {
          console.warn('[TrackEx] Sync failed:', resp?.error);
        }
      });
    });
  }

  // ══════════════════════════════════════════════════════════════
  // ── PRIMARY: DOM-based submission detection ─────────────────
  // ══════════════════════════════════════════════════════════════

  function watchForResults() {
    let lastDetected = '';

    const check = () => {
      if (synced) return;

      // Method 1: Look for result text elements
      const allText = document.body.innerText || '';
      
      // LeetCode shows "Accepted" prominently in the result panel
      const resultPanel = document.querySelector('#qd-content') || document.querySelector('[class*="result"]') || document.body;
      const panelText = resultPanel.innerText || '';

      // Check for specific result patterns
      let resultText = '';
      let runtime = '';
      let memory = '';

      // Look for result status elements
      const statusEls = document.querySelectorAll('span, div, p');
      for (const el of statusEls) {
        if (el.children.length > 2) continue;
        const t = el.textContent?.trim();
        
        // Result detection
        if (!resultText) {
          if (t === 'Accepted' && el.closest('[class*="result"], [class*="submission"], [data-e2e-locator]')) {
            resultText = 'Accepted';
          } else if (t === 'Accepted' && getComputedStyle(el).color.includes('rgb(0') && t.length < 15) {
            resultText = 'Accepted';  
          } else if (t === 'Wrong Answer' || t === 'Time Limit Exceeded' || t === 'Runtime Error' || t === 'Memory Limit Exceeded' || t === 'Compile Error') {
            resultText = t;
          }
        }

        // Runtime/memory detection
        if (!runtime && /^\d+\s*ms$/.test(t)) runtime = t;
        if (!memory && /^\d+(\.\d+)?\s*MB$/.test(t)) memory = t;
      }

      if (resultText && resultText !== lastDetected) {
        lastDetected = resultText;
        console.log('[TrackEx] 🔍 DOM detected:', resultText, runtime, memory);
        
        if (!synced) {
          synced = true;
          attempts = Math.max(attempts, 1);
          syncSubmission(resultText, runtime, memory, `dom-${Date.now()}`);
        }
      }
    };

    // Run check periodically (every 2s) — much more reliable than MutationObserver for SPAs
    const interval = setInterval(check, 2000);

    // Also use MutationObserver for faster detection
    const observer = new MutationObserver(() => {
      if (!synced) check();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Clean up after 10 minutes (avoid memory leak on long sessions)
    setTimeout(() => {
      clearInterval(interval);
      observer.disconnect();
    }, 600000);

    return { interval, observer };
  }

  // ── Init ────────────────────────────────────────────────────
  initTimer();

  // Parse meta after page settles
  setTimeout(() => {
    problemMeta = parseProblemFromDOM();
    saveProblemForPopup();
    console.log('[TrackEx] Parsed:', problemMeta?.title, problemMeta?.difficulty);
  }, 2000);

  // Start DOM watcher
  setTimeout(watchForResults, 3000);

  // SPA navigation
  let lastURL = window.location.href;
  const navObs = new MutationObserver(() => {
    if (window.location.href !== lastURL) {
      lastURL = window.location.href;
      if (lastURL.includes('/problems/')) {
        console.log('[TrackEx] Navigated to new problem');
        problemMeta = null; lastCode = ''; lastLang = ''; attempts = 0; synced = false;
        initTimer();
        setTimeout(() => { problemMeta = parseProblemFromDOM(); saveProblemForPopup(); }, 2000);
        setTimeout(watchForResults, 3000);
      }
    }
  });
  navObs.observe(document.body, { childList: true, subtree: true });

  console.log('[TrackEx] ✅ Content script loaded for:', getSlugFromURL());
})();
