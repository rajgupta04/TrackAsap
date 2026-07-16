import { GoogleGenAI } from '@google/genai';

// Initialize the SDK. It automatically picks up GEMINI_API_KEY from environment variables.
// If it's not present, it will throw an error when we try to call it.
const ai = new GoogleGenAI({});

// @desc    Auto-fill problem details using Gemini API
// @route   POST /api/ai/autofill-problem
// @access  Private
export const autofillProblem = async (req, res) => {
  try {
    return res.status(400).json({ message: '✨ AI Auto-fill is temporarily disabled and coming soon! Stay tuned.' });
  } catch (error) {
    console.error('AI Autofill Error:', error);
    res.status(500).json({ message: error.message || 'AI Autofill failed' });
  }
};
