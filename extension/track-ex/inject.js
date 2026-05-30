// inject.js — Runs in MAIN world (page context) via manifest.json world: "MAIN"
// Intercepts LeetCode's fetch/XHR + reads Monaco editor API for full code.

(function () {
  'use strict';

  console.log('[TrackEx:inject] 🟢 Interceptor loading');

  let lastSubmitCode = '';
  let lastSubmitLang = '';

  // ── Monaco API: get FULL code from editor ───────────────────
  function getMonacoCode() {
    try {
      // Method 1: Monaco editor API (most reliable)
      if (window.monaco && window.monaco.editor) {
        const models = window.monaco.editor.getModels();
        if (models && models.length > 0) {
          const code = models[0].getValue();
          if (code) return code;
        }
        // Try getting from editor instances
        const editors = window.monaco.editor.getEditors?.() || [];
        for (const ed of editors) {
          const val = ed.getValue?.();
          if (val) return val;
        }
      }

      // Method 2: LeetCode's internal CodeMirror/editor state
      const cmEl = document.querySelector('.CodeMirror');
      if (cmEl && cmEl.CodeMirror) {
        return cmEl.CodeMirror.getValue();
      }

      // Method 3: React fiber — find editor component state
      const editorEl = document.querySelector('[data-cy="code-area"]') || 
                       document.querySelector('.monaco-editor') ||
                       document.querySelector('[class*="editor"]');
      if (editorEl) {
        const fiberKey = Object.keys(editorEl).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
        if (fiberKey) {
          let fiber = editorEl[fiberKey];
          for (let i = 0; i < 20 && fiber; i++) {
            const state = fiber.memoizedState || fiber.stateNode?.state;
            if (state?.model) {
              const val = state.model.getValue?.();
              if (val) return val;
            }
            fiber = fiber.return;
          }
        }
      }
    } catch (e) {
      console.log('[TrackEx:inject] Monaco read error:', e.message);
    }
    return '';
  }

  // ── Detect language from Monaco or page ─────────────────────
  function getMonacoLang() {
    try {
      if (window.monaco && window.monaco.editor) {
        const models = window.monaco.editor.getModels();
        if (models && models.length > 0) {
          return models[0].getLanguageId?.() || '';
        }
      }
    } catch (_) {}
    return '';
  }

  // ── Respond to code requests from content.js ────────────────
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data?.type === 'TRACKEX_REQUEST_CODE') {
      const code = getMonacoCode();
      const lang = getMonacoLang() || lastSubmitLang;
      console.log('[TrackEx:inject] Code requested — length:', code.length, 'lang:', lang);
      window.postMessage({
        type: 'TRACKEX_CODE_RESPONSE',
        payload: { code, lang },
      }, '*');
    }
  });

  // ── URL matchers ────────────────────────────────────────────
  function isSubmitURL(url) { return url && /\/problems\/[^/]+\/submit\/?/.test(url); }
  function isCheckURL(url) { return url && /\/submissions\/detail\/\d+\/check\/?/.test(url); }
  function isGraphQLURL(url) { return url && url.includes('/graphql'); }

  function getURL(input) {
    if (typeof input === 'string') return input;
    if (input instanceof Request) return input.url;
    return String(input?.url || input || '');
  }

  function tryParseBody(body) {
    if (!body) return null;
    try {
      if (typeof body === 'string') return JSON.parse(body);
      if (body instanceof ArrayBuffer) return JSON.parse(new TextDecoder().decode(body));
      if (body instanceof Uint8Array) return JSON.parse(new TextDecoder().decode(body));
    } catch (_) {}
    return null;
  }

  // ── Intercept fetch() ───────────────────────────────────────
  const _origFetch = window.fetch;

  window.fetch = function (input, init) {
    const url = getURL(input);
    const method = (init?.method || (input instanceof Request ? input.method : 'GET') || 'GET').toUpperCase();

    if (url.includes('leetcode.com') && (url.includes('/submit') || url.includes('/check'))) {
      console.log(`[TrackEx:inject] fetch ${method} ${url.substring(0, 120)}`);
    }

    // ── Capture submission ────────────────────────────────────
    if (isSubmitURL(url) && method === 'POST') {
      // Always grab code from Monaco when submit is detected
      const monacoCode = getMonacoCode();
      const monacoLang = getMonacoLang();
      
      let body = init?.body;
      if (input instanceof Request && !body) {
        try {
          const cloned = input.clone();
          cloned.text().then(text => {
            const parsed = tryParseBody(text);
            if (parsed) {
              lastSubmitCode = monacoCode || parsed.typed_code || parsed.code || '';
              lastSubmitLang = parsed.lang || monacoLang || '';
              console.log('[TrackEx:inject] ✅ Submit captured (Request):', lastSubmitLang, 'code:', lastSubmitCode.length);
              window.postMessage({ type: 'TRACKEX_SUBMISSION_SENT', payload: { lang: lastSubmitLang, code: lastSubmitCode } }, '*');
            }
          }).catch(() => {});
        } catch (_) {}
      } else {
        const parsed = tryParseBody(body);
        lastSubmitCode = monacoCode || parsed?.typed_code || parsed?.code || '';
        lastSubmitLang = parsed?.lang || monacoLang || '';
        console.log('[TrackEx:inject] ✅ Submit captured:', lastSubmitLang, 'code:', lastSubmitCode.length);
        window.postMessage({ type: 'TRACKEX_SUBMISSION_SENT', payload: { lang: lastSubmitLang, code: lastSubmitCode } }, '*');
      }
    }

    const promise = _origFetch.apply(this, arguments);

    // ── Check results ─────────────────────────────────────────
    if (isCheckURL(url)) {
      promise.then(resp => {
        resp.clone().text().then(text => {
          try {
            const data = JSON.parse(text);
            if (data.state === 'SUCCESS') {
              const subId = url.match(/\/submissions\/detail\/(\d+)/)?.[1] || String(Date.now());
              // If we didn't capture code during submit, grab it now
              if (!lastSubmitCode) lastSubmitCode = getMonacoCode();
              console.log('[TrackEx:inject] ✅ Result:', data.status_msg, data.status_runtime, '| code:', lastSubmitCode.length);
              window.postMessage({
                type: 'TRACKEX_SUBMISSION_RESULT',
                payload: {
                  submissionId: subId,
                  statusDisplay: data.status_msg || '',
                  lang: data.lang || lastSubmitLang,
                  runtime: data.status_runtime || '',
                  memory: data.status_memory || '',
                  code: lastSubmitCode,
                },
              }, '*');
            }
          } catch (_) {}
        }).catch(() => {});
      }).catch(() => {});
    }

    // ── GraphQL problem metadata ──────────────────────────────
    if (isGraphQLURL(url) && method === 'POST') {
      const parsed = tryParseBody(init?.body);
      const op = parsed?.operationName || '';
      if (op.toLowerCase().includes('question') || op === 'consolePanelConfig') {
        promise.then(resp => {
          resp.clone().json().then(d => {
            const q = d?.data?.question;
            if (q?.title) {
              window.postMessage({
                type: 'TRACKEX_PROBLEM_META',
                payload: { title: q.title, titleSlug: q.titleSlug || '', difficulty: q.difficulty || '', topicTags: (q.topicTags || []).map(t => t.name || t) },
              }, '*');
            }
          }).catch(() => {});
        }).catch(() => {});
      }
    }

    return promise;
  };

  // ── Intercept XMLHttpRequest ────────────────────────────────
  const _origOpen = XMLHttpRequest.prototype.open;
  const _origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._trackex = { method: method?.toUpperCase(), url: url || '' };
    return _origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    const url = this._trackex?.url || '';

    if (isSubmitURL(url) && this._trackex?.method === 'POST') {
      const monacoCode = getMonacoCode();
      const parsed = tryParseBody(body);
      lastSubmitCode = monacoCode || parsed?.typed_code || parsed?.code || '';
      lastSubmitLang = parsed?.lang || getMonacoLang() || '';
      console.log('[TrackEx:inject] ✅ XHR Submit:', lastSubmitLang, 'code:', lastSubmitCode.length);
      window.postMessage({ type: 'TRACKEX_SUBMISSION_SENT', payload: { lang: lastSubmitLang, code: lastSubmitCode } }, '*');
    }

    if (isCheckURL(url)) {
      this.addEventListener('load', function () {
        try {
          const data = JSON.parse(this.responseText);
          if (data.state === 'SUCCESS') {
            if (!lastSubmitCode) lastSubmitCode = getMonacoCode();
            const subId = url.match(/\/submissions\/detail\/(\d+)/)?.[1] || String(Date.now());
            window.postMessage({
              type: 'TRACKEX_SUBMISSION_RESULT',
              payload: {
                submissionId: subId, statusDisplay: data.status_msg || '',
                lang: data.lang || lastSubmitLang,
                runtime: data.status_runtime || '', memory: data.status_memory || '',
                code: lastSubmitCode,
              },
            }, '*');
          }
        } catch (_) {}
      });
    }

    return _origSend.apply(this, arguments);
  };

  console.log('[TrackEx:inject] ✅ Interceptors + Monaco reader installed');
})();
