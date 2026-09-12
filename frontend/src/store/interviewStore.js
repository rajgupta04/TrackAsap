import { create } from 'zustand';
import { interviewService } from '../services/interviewService';

export const useInterviewStore = create((set, get) => ({
  sessions: [],
  totalSessions: 0,
  currentPage: 1,
  totalPages: 1,
  currentSession: null,
  livekitToken: null,
  livekitUrl: 'ws://localhost:7880',
  transcript: [],
  userContext: null,

  // Live session audio/connection states
  isAISpeaking: false,
  isCandidateSpeaking: false,
  isMuted: false,
  connectionStatus: 'idle', // 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'
  activeSection: 'intro',
  isLoading: false,
  error: null,

  fetchUserContext: async () => {
    try {
      const data = await interviewService.getUserContext();
      if (data.success) {
        set({ userContext: data.context });
      }
    } catch (err) {
      console.warn('Could not load user interview context:', err);
    }
  },

  fetchSessions: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const data = await interviewService.listSessions(page, limit);
      if (data.success) {
        set({
          sessions: data.sessions,
          totalSessions: data.total,
          currentPage: data.page,
          totalPages: data.pages,
          isLoading: false,
        });
      }
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load interview history',
        isLoading: false,
      });
    }
  },

  createSession: async (sessionConfig) => {
    set({ isLoading: true, error: null });
    try {
      const data = await interviewService.createSession(sessionConfig);
      if (data.success) {
        set({
          currentSession: data.session,
          livekitToken: data.livekitToken,
          livekitUrl: data.livekitUrl,
          transcript: data.session.transcript || [],
          isLoading: false,
        });
        return { success: true, session: data.session, livekitToken: data.livekitToken };
      }
      throw new Error(data.message || 'Creation failed');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to create session';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  fetchSession: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await interviewService.getSession(sessionId);
      if (data.success) {
        set({
          currentSession: data.session,
          transcript: data.session.transcript || [],
          isLoading: false,
        });
        return { success: true, session: data.session };
      }
      throw new Error('Session not found');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load session';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  appendTranscriptTurn: async (speaker, text, section = 'general', speakerName = null, speakerRole = null, panelistColor = null) => {
    const { currentSession, transcript } = get();
    const newTurn = {
      speaker,
      text,
      timestamp: Date.now(),
      section,
      speakerName,
      speakerRole,
      panelistColor,
    };

    set({ transcript: [...transcript, newTurn] });

    if (currentSession?._id) {
      try {
        await interviewService.addTranscriptTurn(currentSession._id, newTurn);
      } catch (err) {
        console.warn('Failed to sync transcript turn to backend:', err);
      }
    }
  },

  submitEvaluation: async (sessionId, evaluation) => {
    try {
      const data = await interviewService.submitEvaluation(sessionId, evaluation);
      if (data.success) {
        set({ currentSession: data.session });
        return { success: true, session: data.session };
      }
    } catch (err) {
      console.error('Failed to submit evaluation:', err);
      return { success: false, error: err.message };
    }
  },

  evaluateSession: async (sessionId, transcript = null) => {
    try {
      const data = await interviewService.evaluateSession(sessionId, transcript);
      if (data.success) {
        set({ currentSession: data.session });
        return { success: true, session: data.session, evaluation: data.evaluation };
      }
      throw new Error(data.message || 'Evaluation generation failed');
    } catch (err) {
      console.error('Failed to evaluate session:', err);
      return { success: false, error: err.response?.data?.message || err.message };
    }
  },

  deleteSession: async (sessionId) => {
    try {
      await interviewService.deleteSession(sessionId);
      const { sessions } = get();
      set({ sessions: sessions.filter((s) => s._id !== sessionId) });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getInitialQuestion: async (sessionId) => {
    try {
      const data = await interviewService.getInitialQuestion(sessionId);
      if (data.success && data.initialQuestion) {
        return { success: true, initialQuestion: data.initialQuestion, section: data.section };
      }
    } catch (err) {
      console.warn('Failed to fetch dynamic initial question from backend:', err);
    }
    return { success: false };
  },

  getNextTurn: async (sessionId, candidateAnswer) => {
    const { transcript } = get();
    try {
      const data = await interviewService.getNextTurn(sessionId, candidateAnswer, transcript);
      if (data.success && data.aiResponse) {
        return { success: true, aiResponse: data.aiResponse, section: data.section };
      }
    } catch (err) {
      console.warn('Failed to fetch dynamic follow-up from backend:', err);
    }
    return { success: false };
  },

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setAISpeaking: (isAISpeaking) => set({ isAISpeaking }),
  setCandidateSpeaking: (isCandidateSpeaking) => set({ isCandidateSpeaking }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setActiveSection: (activeSection) => set({ activeSection }),
  resetActiveSession: () =>
    set({
      currentSession: null,
      livekitToken: null,
      transcript: [],
      isAISpeaking: false,
      isCandidateSpeaking: false,
      connectionStatus: 'idle',
    }),
}));
