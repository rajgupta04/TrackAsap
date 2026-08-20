import api from '../lib/api';

/**
 * Client-side Telemetry & Clickstream Tracker
 * Captures user interactions, clicks, and page transitions with zero UI lag.
 */

// Generate or retrieve persistent session ID
const getSessionId = () => {
  let sid = sessionStorage.getItem('trackasap_session_id');
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('trackasap_session_id', sid);
  }
  return sid;
};

// Queue buffer for batching
let eventQueue = [];
let flushTimeout = null;
let isInitialized = false;
let cachedPublicIp = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('trackasap_client_ip') : '') || '';

// Fetch real public IP asynchronously without blocking any UI
const resolveClientPublicIp = async () => {
  if (cachedPublicIp) return cachedPublicIp;
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout?.(3500) });
    if (res.ok) {
      const data = await res.json();
      if (data?.ip) {
        cachedPublicIp = data.ip;
        sessionStorage.setItem('trackasap_client_ip', data.ip);
        return data.ip;
      }
    }
  } catch {
    // Fail silently
  }
  return '';
};

// Get current user from localStorage safely
const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Flush all queued events to the backend in a single non-blocking batch
 */
export const flushEvents = async () => {
  if (eventQueue.length === 0) return;

  const eventsToSend = [...eventQueue];
  eventQueue = [];

  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  const payload = JSON.stringify({ events: eventsToSend });

  // Use sendBeacon if page is unloading
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    const success = navigator.sendBeacon('/api/telemetry/beacon', blob);
    if (success) return;
  }

  // Fallback to standard non-blocking API call
  try {
    await api.post('/telemetry/events', { events: eventsToSend });
  } catch (err) {
    // Fail silently so user experience is never impacted
    console.debug('[Telemetry] Batch delivery notice:', err.message);
  }
};

/**
 * Enqueue a telemetry event
 */
export const trackEvent = (eventType, data = {}) => {
  const user = getCurrentUser();

  const eventPayload = {
    userId: user?._id,
    userEmail: user?.email || 'anonymous',
    userName: user?.name || 'Guest',
    sessionId: getSessionId(),
    eventType: eventType || 'click',
    clientPublicIp: cachedPublicIp || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('trackasap_client_ip') : '') || '',
    element: data.element || {},
    page: {
      pathname: window.location.pathname,
      search: window.location.search,
      title: document.title,
      referrer: document.referrer || '',
    },
    coordinates: data.coordinates || {
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
    },
    metadata: data.metadata || {},
    timestamp: new Date().toISOString(),
  };

  eventQueue.push(eventPayload);

  // Auto-flush if queue reaches 10 items
  if (eventQueue.length >= 10) {
    flushEvents();
  } else if (!flushTimeout) {
    // Otherwise flush after 3 seconds debounce
    flushTimeout = setTimeout(flushEvents, 3000);
  }
};

/**
 * Extract clean description from clicked DOM element
 */
const getElementDescription = (el) => {
  if (!el || el === document.body) return null;

  // Search up to 4 parents for interactive elements
  let target = el;
  let depth = 0;
  while (target && depth < 4 && target !== document.body) {
    const tag = target.tagName?.toLowerCase();
    const role = target.getAttribute('role');
    const isInteractive =
      tag === 'button' ||
      tag === 'a' ||
      tag === 'input' ||
      tag === 'select' ||
      tag === 'textarea' ||
      role === 'button' ||
      role === 'tab' ||
      role === 'link' ||
      target.classList?.contains('cursor-pointer') ||
      target.onclick != null;

    if (isInteractive) break;
    target = target.parentElement;
    depth++;
  }

  if (!target || target === document.body) {
    target = el;
  }

  // Get readable text or label
  let text =
    target.getAttribute('aria-label') ||
    target.getAttribute('title') ||
    target.getAttribute('placeholder') ||
    '';

  if (!text) {
    // If element has direct text or is a button/link/badge
    const isSmall = target.children.length <= 2;
    if (isSmall) {
      text = target.innerText || target.textContent || '';
    } else {
      text = el.innerText || el.textContent || '';
    }
  }

  text = text.trim().replace(/\s+/g, ' ');
  if (text.length > 55) {
    text = text.slice(0, 52) + '...';
  }

  return {
    tag: target.tagName?.toLowerCase() || '',
    id: target.id || '',
    className: (target.className && typeof target.className === 'string' ? target.className.slice(0, 100) : ''),
    text: text || `${target.tagName?.toLowerCase() || 'element'} click`,
    role: target.getAttribute('role') || '',
    ariaLabel: target.getAttribute('aria-label') || '',
    targetHref: target.getAttribute('href') || '',
  };
};

/**
 * Initialize global event listeners
 */
export const initTelemetry = () => {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // Resolve public IP in background
  resolveClientPublicIp();

  // 1. Global Click Tracker
  document.addEventListener(
    'click',
    (e) => {
      try {
        const elementInfo = getElementDescription(e.target);
        if (!elementInfo) return;

        trackEvent('click', {
          element: elementInfo,
          coordinates: {
            x: Math.round(e.clientX),
            y: Math.round(e.clientY),
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
          },
        });
      } catch (err) {
        console.debug('[Telemetry] Click capture notice:', err);
      }
    },
    { passive: true, capture: true }
  );

  // 2. Unload / Visibility Flush
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushEvents();
    }
  });

  window.addEventListener('pagehide', flushEvents);
  window.addEventListener('beforeunload', flushEvents);

  // Track initial page load
  trackEvent('pageview', {
    element: { text: `Viewed ${window.location.pathname}` },
  });
};

/**
 * Track route transitions
 */
export const trackPageView = (pathname) => {
  trackEvent('pageview', {
    element: { text: `Navigated to ${pathname}` },
  });
};

export default {
  initTelemetry,
  trackEvent,
  trackPageView,
  flushEvents,
};
