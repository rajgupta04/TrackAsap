import { AccessToken } from 'livekit-server-sdk';
import InterviewSession from '../models/InterviewSession.model.js';
import Problem from '../models/Problem.model.js';
import { generateInterviewEvaluation } from '../utils/interviewEvaluator.js';
import { extractResumeText } from '../utils/resumeParser.js';
import { getInitialQuestion, generateNextInterviewTurn } from '../utils/interviewConversationalAgent.js';

// Helper to generate LiveKit token with fallback for local/mock development
const generateLiveKitToken = async (roomName, user, metadata = {}) => {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    // Return mock token for local offline / development testing
    return `mock_lk_token_${user._id}_${Date.now()}`;
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: user._id.toString(),
      name: user.name || 'Candidate',
      metadata: JSON.stringify({
        userId: user._id,
        name: user.name,
        email: user.email,
        ...metadata,
      }),
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return await at.toJwt();
  } catch (error) {
    console.error('Error minting LiveKit AccessToken:', error);
    return `mock_lk_token_${user._id}_${Date.now()}`;
  }
};

/**
 * @route   POST /api/interview/session
 * @desc    Create a new AI interview session & mint LiveKit room token
 * @access  Private
 */
export const createSession = async (req, res) => {
  try {
    const {
      mode = 'general_sde',
      difficulty = 'medium',
      targetRole = 'Software Development Engineer',
      targetCompany = '',
      jobDescription = '',
      resumeText = '',
      durationMinutes = 20,
    } = req.body;

    const roomSuffix = Math.random().toString(36).substring(2, 7);
    const roomName = `trackasap_${req.user._id.toString().slice(-6)}_${Date.now()}_${roomSuffix}`;

    const session = await InterviewSession.create({
      user: req.user._id,
      roomName,
      mode,
      difficulty,
      targetRole,
      targetCompany,
      jobDescription,
      resumeText,
      durationMinutes,
      status: 'created',
      transcript: [],
    });

    const livekitToken = await generateLiveKitToken(roomName, req.user, {
      sessionId: session._id.toString(),
      mode,
      difficulty,
      targetRole,
    });

    const livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';

    res.status(201).json({
      success: true,
      session,
      livekitToken,
      livekitUrl,
    });
  } catch (error) {
    console.error('Create interview session error:', error);
    res.status(500).json({ message: 'Failed to create interview session', error: error.message });
  }
};

/**
 * @route   GET /api/interview/session/:id
 * @desc    Get interview session details, transcript, and evaluation
 * @access  Private
 */
export const getSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    // Ownership check (or admin)
    if (session.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this interview session' });
    }

    res.json({ success: true, session });
  } catch (error) {
    console.error('Get interview session error:', error);
    res.status(500).json({ message: 'Failed to fetch interview session', error: error.message });
  }
};

/**
 * @route   GET /api/interview/sessions
 * @desc    List all interview sessions for the current user
 * @access  Private
 */
export const listSessions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };

    const total = await InterviewSession.countDocuments(query);
    const sessions = await InterviewSession.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-resumeText -jobDescription');

    res.json({
      success: true,
      count: sessions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      sessions,
    });
  } catch (error) {
    console.error('List interview sessions error:', error);
    res.status(500).json({ message: 'Failed to fetch interview sessions', error: error.message });
  }
};

/**
 * @route   POST /api/interview/session/:id/token
 * @desc    Get or refresh LiveKit access token for an active session
 * @access  Private
 */
export const getSessionToken = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    if (session.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const livekitToken = await generateLiveKitToken(session.roomName, req.user, {
      sessionId: session._id.toString(),
      mode: session.mode,
      difficulty: session.difficulty,
      targetRole: session.targetRole,
    });

    const livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';

    res.json({
      success: true,
      livekitToken,
      livekitUrl,
      roomName: session.roomName,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Failed to mint LiveKit token', error: error.message });
  }
};

/**
 * @route   POST /api/interview/session/:id/transcript
 * @desc    Append a transcript turn (called by Agent or Web Client)
 * @access  Private
 */
export const addTranscriptTurn = async (req, res) => {
  try {
    const { speaker, text, timestamp = Date.now(), section = 'general' } = req.body;

    if (!speaker || !text) {
      return res.status(400).json({ message: 'Speaker and text are required' });
    }

    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    if (session.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (session.status === 'created') {
      session.status = 'active';
      session.startedAt = new Date();
    }

    session.transcript.push({
      speaker,
      text,
      timestamp,
      section,
    });

    await session.save();

    res.json({ success: true, message: 'Transcript turn added', count: session.transcript.length });
  } catch (error) {
    console.error('Add transcript error:', error);
    res.status(500).json({ message: 'Failed to update transcript', error: error.message });
  }
};

/**
 * @route   POST /api/interview/session/:id/evaluation
 * @desc    Submit or finalize post-interview evaluation report
 * @access  Private
 */
export const submitEvaluation = async (req, res) => {
  try {
    const { evaluation } = req.body;

    if (!evaluation) {
      return res.status(400).json({ message: 'Evaluation object is required' });
    }

    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    if (session.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    session.evaluation = evaluation;
    session.status = 'completed';
    session.endedAt = new Date();

    await session.save();

    res.json({ success: true, message: 'Evaluation submitted successfully', session });
  } catch (error) {
    console.error('Submit evaluation error:', error);
    res.status(500).json({ message: 'Failed to submit evaluation', error: error.message });
  }
};

/**
 * @route   POST /api/interview/session/:id/evaluate
 * @desc    Generate authentic AI evaluation from interview transcript
 * @access  Private
 */
export const evaluateSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    if (session.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const clientTranscript = req.body.transcript;

    // If client provided any latest turns that haven't been persisted yet, update transcript
    if (Array.isArray(clientTranscript) && clientTranscript.length > session.transcript.length) {
      session.transcript = clientTranscript;
    }

    const evaluation = await generateInterviewEvaluation(session, clientTranscript);

    session.evaluation = evaluation;
    session.status = 'completed';
    session.endedAt = new Date();

    await session.save();

    res.json({
      success: true,
      message: 'Interview evaluated successfully',
      evaluation,
      session,
    });
  } catch (error) {
    console.error('Evaluate interview session error:', error);
    res.status(500).json({ message: 'Failed to evaluate interview session', error: error.message });
  }
};

/**
 * @route   DELETE /api/interview/session/:id
 * @desc    Delete an interview session and its transcript (Privacy/User sovereignty)
 * @access  Private
 */
export const deleteSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    if (session.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await InterviewSession.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Interview session and transcript permanently deleted' });
  } catch (error) {
    console.error('Delete interview session error:', error);
    res.status(500).json({ message: 'Failed to delete interview session', error: error.message });
  }
};

/**
 * @route   GET /api/interview/user-context
 * @desc    Retrieve TrackAsap learning stats & problem solving history for AI Interviewer context
 * @access  Private
 */
export const getUserContext = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch user problems stats if available
    let totalSolved = 0;
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;
    let topicCounts = {};

    try {
      const solvedProblems = await Problem.find({ user: userId, status: 'Solved' }).select(
        'difficulty topic platform'
      );

      totalSolved = solvedProblems.length;
      solvedProblems.forEach((p) => {
        if (p.difficulty === 'Easy') easySolved++;
        else if (p.difficulty === 'Medium') mediumSolved++;
        else if (p.difficulty === 'Hard') hardSolved++;

        if (p.topic) {
          topicCounts[p.topic] = (topicCounts[p.topic] || 0) + 1;
        }
      });
    } catch (err) {
      // Non-fatal if Problem model is different
    }

    // Previous interview scores
    const pastSessions = await InterviewSession.find({
      user: userId,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('mode evaluation.overallScore evaluation.weaknesses createdAt');

    res.json({
      success: true,
      context: {
        userName: req.user.name,
        email: req.user.email,
        handles: {
          leetcode: req.user.leetcodeHandle || '',
          codeforces: req.user.codeforcesHandle || '',
          codechef: req.user.codechefHandle || '',
        },
        dsaStats: {
          totalSolved,
          easySolved,
          mediumSolved,
          hardSolved,
          topics: topicCounts,
        },
        pastInterviews: pastSessions.map((s) => ({
          mode: s.mode,
          score: s.evaluation?.overallScore || 0,
          weaknesses: s.evaluation?.weaknesses || [],
          date: s.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get user context error:', error);
    res.status(500).json({ message: 'Failed to fetch user context', error: error.message });
  }
};

/**
 * @route   POST /api/interview/upload-resume
 * @desc    Upload and parse candidate resume (PDF, DOCX, TXT, MD)
 * @access  Private
 */
export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No resume file uploaded' });
    }

    const text = await extractResumeText(req.file);

    res.json({
      success: true,
      message: 'Resume parsed successfully',
      text,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ message: error.message || 'Failed to process resume file' });
  }
};

/**
 * @route   GET /api/interview/session/:id/initial-question
 * @desc    Get dynamic opening question calibrated to session mode, role, and context
 * @access  Private
 */
export const getInitialTurn = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    if (session.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const question = await getInitialQuestion(session, req.user);

    // Persist opening question permanently on session
    session.initialQuestion = question;

    // If transcript is empty, register opening AI turn
    if (session.transcript.length === 0) {
      session.transcript.push({
        speaker: 'ai',
        text: question,
        timestamp: Date.now(),
        section: 'intro',
      });
      session.status = 'active';
      session.startedAt = new Date();
    }
    await session.save();

    res.json({
      success: true,
      initialQuestion: question,
      section: 'intro',
    });
  } catch (error) {
    console.error('Get initial question error:', error);
    res.status(500).json({ message: 'Failed to generate opening question', error: error.message });
  }
};

/**
 * @route   POST /api/interview/session/:id/next-turn
 * @desc    Generate real-time dynamic LLM response calibrated to candidate answer & mode
 * @access  Private
 */
export const getNextTurn = async (req, res) => {
  try {
    const { candidateAnswer, clientTranscript } = req.body;

    if (!candidateAnswer) {
      return res.status(400).json({ message: 'candidateAnswer is required' });
    }

    const session = await InterviewSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    if (session.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Sync client transcript if provided
    if (Array.isArray(clientTranscript) && clientTranscript.length > session.transcript.length) {
      session.transcript = clientTranscript;
    }

    // Record candidate answer in session transcript if not recorded yet
    const lastTurn = session.transcript[session.transcript.length - 1];
    if (!lastTurn || lastTurn.speaker !== 'user' || lastTurn.text !== candidateAnswer) {
      session.transcript.push({
        speaker: 'user',
        text: candidateAnswer,
        timestamp: Date.now(),
        section: 'discussion',
      });
    }

    // Generate dynamic turn via Groq / Gemini
    const { aiResponse, section } = await generateNextInterviewTurn(
      session,
      session.transcript,
      candidateAnswer
    );

    // Record AI turn
    session.transcript.push({
      speaker: 'ai',
      text: aiResponse,
      timestamp: Date.now(),
      section,
    });

    session.status = 'active';
    await session.save();

    res.json({
      success: true,
      aiResponse,
      section,
      transcriptCount: session.transcript.length,
    });
  } catch (error) {
    console.error('Get next turn error:', error);
    res.status(500).json({ message: 'Failed to generate dynamic follow-up', error: error.message });
  }
};


