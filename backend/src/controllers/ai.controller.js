import { GoogleGenAI } from '@google/genai';

// Initialize the SDK. It automatically picks up GEMINI_API_KEY from environment variables.
// If it's not present, it will throw an error when we try to call it.
const ai = new GoogleGenAI({});

// @desc    Auto-fill problem details using Gemini API
// @route   POST /api/ai/autofill-problem
// @access  Private
export const autofillProblem = async (req, res) => {
  try {
    const { link, title, sheetTopics } = req.body;

    if (!link && !title) {
      return res.status(400).json({ message: 'Please provide either a problem link or title' });
    }

    const input = link ? `Problem Link: ${link}` : `Problem Title: ${title}`;
    
    // Construct the prompt
    const prompt = `
You are a programming problem analyzer. I will provide you with a problem link or title.
Your task is to predict/extract the following details and return them strictly as a JSON object without any markdown formatting, backticks, or extra text.

${input}

Please return a JSON object with EXACTLY these keys:
{
  "title": "Extracted or predicted problem title (String)",
  "difficulty": "One of: easy, medium, hard (String)",
  "topic": "The most relevant topic for this problem (String). Choose the closest match from this list if possible: [${sheetTopics?.join(', ') || 'Arrays, Strings, Linked List, DP, Graphs, Trees, Math, Greedy, Two Pointers'}]. If none match, provide a brief topic name.",
  "platform": "One of: leetcode, geeksforgeeks, codechef, codeforces, hackerrank, interviewbit, other (String)",
  "tags": ["tag1", "tag2", "tag3"] (Array of Strings, max 5 tags)
}
    `;

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text;
    
    // Attempt to parse JSON. Sometimes the model might wrap in \`\`\`json ... \`\`\` despite instructions.
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
    } else if (jsonStr.startsWith('\`\`\`')) {
      jsonStr = jsonStr.substring(3, jsonStr.length - 3).trim();
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      return res.status(500).json({ message: 'Failed to parse AI response. Please try again.' });
    }

    // Ensure platform is valid
    const validPlatforms = ['leetcode', 'geeksforgeeks', 'codechef', 'codeforces', 'hackerrank', 'interviewbit', 'other'];
    if (!validPlatforms.includes(parsedData.platform?.toLowerCase())) {
      parsedData.platform = 'other';
    }

    // Ensure difficulty is valid
    const validDiffs = ['easy', 'medium', 'hard'];
    if (!validDiffs.includes(parsedData.difficulty?.toLowerCase())) {
      parsedData.difficulty = 'medium';
    } else {
      parsedData.difficulty = parsedData.difficulty.toLowerCase();
    }

    res.json(parsedData);
  } catch (error) {
    console.error('AI Autofill Error:', error);
    res.status(500).json({ message: error.message || 'AI Autofill failed' });
  }
};
