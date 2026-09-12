/**
 * Speech Synthesis helper utilities for reliable audio lifecycle control across the app.
 * Resolves Chrome/Chromium background playback bugs, queue stalls, and route-transition audio leaks.
 */

export const stopAllSpeech = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    // 1. Cancel active and pending utterances
    window.speechSynthesis.cancel();

    // 2. In Chromium engines, ensure paused state is never left frozen
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch (e) {
    console.warn('Speech cancellation error:', e);
  }
};

/**
 * Stop all speech with multiple retries to thoroughly flush stubborn OS audio threads
 */
export const flushSpeechQueue = () => {
  stopAllSpeech();
  if (typeof window !== 'undefined') {
    window.setTimeout(stopAllSpeech, 50);
    window.setTimeout(stopAllSpeech, 150);
    window.setTimeout(stopAllSpeech, 300);
  }
};
