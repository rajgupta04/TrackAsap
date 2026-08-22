import { GoogleGenAI } from '@google/genai';

/**
 * Extract LeetCode slug from a full URL or title string.
 */
function extractLeetCodeSlug(urlOrTitle) {
  if (!urlOrTitle) return '';
  const match = urlOrTitle.match(/leetcode\.com\/problems\/([a-zA-Z0-9\-]+)/i);
  if (match) return match[1].toLowerCase();
  return urlOrTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Scrape problem details directly from official LeetCode GraphQL API.
 */
async function scrapeLeetCodeProblem(slug) {
  const query = `
    query getQuestionDetail($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        titleSlug
        content
        difficulty
        topicTags {
          name
          slug
        }
        hints
      }
    }
  `;

  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Referer: 'https://leetcode.com',
    },
    body: JSON.stringify({ query, variables: { titleSlug: slug } }),
  });

  if (!res.ok) {
    throw new Error(`LeetCode GraphQL responded with ${res.status}`);
  }

  const json = await res.json();
  return json.data?.question;
}

/**
 * Best-effort match of LeetCode topic tags to existing sheet topics.
 */
function matchTopic(tags = [], sheetTopics = []) {
  if (!sheetTopics || sheetTopics.length === 0) {
    return tags[0] || 'General';
  }

  const normalizedSheetTopics = sheetTopics.map((t) => ({
    original: t,
    lower: t.toLowerCase(),
  }));

  for (const tag of tags) {
    const tagLower = tag.toLowerCase();
    const found = normalizedSheetTopics.find(
      (st) => st.lower.includes(tagLower) || tagLower.includes(st.lower)
    );
    if (found) return found.original;
  }

  return sheetTopics[0] || tags[0] || 'General';
}

// @desc    Auto-fill problem details using LeetCode Scraper & Gemini AI fallback
// @route   POST /api/ai/autofill-problem
// @access  Private
export const autofillProblem = async (req, res) => {
  try {
    const { link, title, sheetTopics = [] } = req.body;

    if (!link && !title) {
      return res.status(400).json({ message: 'Problem link or title is required' });
    }

    const slug = extractLeetCodeSlug(link || title);

    // 1. Try scraping directly from official LeetCode GraphQL API
    if (slug) {
      try {
        const question = await scrapeLeetCodeProblem(slug);
        if (question && question.title) {
          const tags = (question.topicTags || []).map((t) => t.name);
          const chosenTopic = matchTopic(tags, sheetTopics);

          return res.json({
            title: question.title,
            difficulty: (question.difficulty || 'medium').toLowerCase(),
            topic: chosenTopic,
            tags,
            platform: 'leetcode',
            problemLink: link || `https://leetcode.com/problems/${slug}/`,
            hints: question.hints || [],
          });
        }
      } catch (scrapeErr) {
        console.warn('[LeetCode Scraper] Direct scrape failed, falling back to AI:', scrapeErr.message);
      }
    }

    // 2. AI Gemini Fallback
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a Data Structures and Algorithms problem classifier for TrackAsap.
Analyze the following problem title or link:
Input: "${link || title}"
Available Sheet Topics: ${sheetTopics.join(', ') || 'Arrays, Strings, Dynamic Programming, Trees, Graphs, Greedy, Stack, Queue, Linked List, Heap, Backtracking, Bit Manipulation, Math, Binary Search'}

Respond ONLY with valid JSON in this exact structure:
{
  "title": "<Clean Official Problem Name>",
  "difficulty": "easy" | "medium" | "hard",
  "topic": "<Best matching topic from the Available Sheet Topics>",
  "tags": ["<tag1>", "<tag2>"],
  "platform": "leetcode" | "codeforces" | "codechef" | "geeksforgeeks" | "other"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        return res.json({
          title: parsed.title || title || 'New Problem',
          difficulty: (parsed.difficulty || 'medium').toLowerCase(),
          topic: parsed.topic || sheetTopics[0] || 'General',
          tags: parsed.tags || [],
          platform: parsed.platform || 'leetcode',
          problemLink: link || '',
        });
      }
    }

    // 3. Fallback Heuristic
    res.json({
      title: title || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'New Problem',
      difficulty: 'medium',
      topic: sheetTopics[0] || 'General',
      tags: [],
      platform: 'leetcode',
      problemLink: link || '',
    });
  } catch (error) {
    console.error('AI Autofill Error:', error);
    res.status(500).json({ message: error.message || 'AI Autofill failed' });
  }
};
