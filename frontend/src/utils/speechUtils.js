/**
 * Speech Synthesis helper utilities for reliable audio lifecycle control across the app.
 * Resolves Chrome/Chromium background playback bugs, queue stalls, and route-transition audio leaks.
 */

export const stopAllSpeech = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    // 1. Pause immediately to halt active speaker output
    window.speechSynthesis.pause();

    // 2. Clear queued utterances
    window.speechSynthesis.cancel();

    // 3. In Chromium engines, if speech was paused, a resume-cancel flush clears any hung audio thread
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.resume();
      window.speechSynthesis.cancel();
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
