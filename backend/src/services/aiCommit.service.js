import { GoogleGenAI } from '@google/genai';

/**
 * Deterministic fallback generator if AI API key is not configured or fails.
 */
export function generateHeuristicCommitMessage(changes = {}) {
  const { added = [], modified = [], deleted = [] } = changes;
  const changedFiles = [...added, ...modified];

  if (changedFiles.length === 0) {
    return {
      title: 'chore: sync repository with TrackAsap',
      body: 'Synced solutions, notes, and activity README.',
    };
  }

  // Extract problem names and topics
  const topics = new Set();
  const problemTitles = new Set();
  let hasNotes = false;
  let hasCode = false;

  for (const f of changedFiles) {
    const parts = (f.path || '').split('/');
    if (f.path.endsWith('.notes.md')) {
      hasNotes = true;
    } else if (f.path.includes('.')) {
      hasCode = true;
    }

    if (parts.length >= 3) {
      topics.add(parts[parts.length - 2].toLowerCase());
    }

    const filename = parts[parts.length - 1].replace(/\.(notes\.md|[a-z0-9]+)$/i, '');
    if (filename && filename !== 'README') {
      problemTitles.add(filename.replace(/-/g, ' '));
    }
  }

  const topicStr = topics.size > 0 ? Array.from(topics).slice(0, 2).join(',') : 'dsa';
  const titlesList = Array.from(problemTitles);
  const titleSummary = titlesList.length > 0
    ? titlesList.slice(0, 2).join(', ') + (titlesList.length > 2 ? ` +${titlesList.length - 2} more` : '')
    : `${changedFiles.length} item(s)`;

  let prefix = 'feat';
  if (hasNotes && !hasCode) prefix = 'docs';
  else if (modified.length > 0 && added.length === 0) prefix = 'refactor';

  const title = `${prefix}(${topicStr}): update ${titleSummary}`;

  const bullets = [];
  if (added.length > 0) bullets.push(`- Added ${added.length} new solution file(s)`);
  if (modified.length > 0) bullets.push(`- Updated ${modified.length} solution/note file(s)`);
  if (deleted.length > 0) bullets.push(`- Removed ${deleted.length} obsolete file(s)`);
  bullets.push(`- Auto-synced via TrackAsap at ${new Date().toISOString().split('T')[0]}`);

  return {
    title,
    body: bullets.join('\n'),
  };
}

/**
 * Generate a smart semantic commit message using Google Gemini API.
 */
export async function generateAICommitMessage(changes = {}) {
  const { added = [], modified = [], deleted = [] } = changes;
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return generateHeuristicCommitMessage(changes);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Prepare context payload (compact summaries of changed code and notes)
    const filesSummary = [...added.map(f => ({ ...f, changeType: 'added' })), ...modified.map(f => ({ ...f, changeType: 'modified' }))]
      .slice(0, 10) // Limit to top 10 files to keep token usage super light & fast
      .map(f => {
        const snippet = (f.content || '').slice(0, 400); // first 400 chars
        return `File: ${f.path} (${f.changeType})\nSnippet:\n${snippet}\n---`;
      })
      .join('\n\n');

    const prompt = `You are a Git commit message generator for a Competitive Programming & Data Structures platform called TrackAsap.
Analyze the following changed problem solution and notes files and generate a clear, professional Conventional Commit message (e.g. feat(topic): ..., docs(topic): ..., refactor(topic): ...).

Changed Files Summary:
${filesSummary}
${deleted.length > 0 ? `Deleted Files: ${deleted.map(d => d.path).join(', ')}` : ''}

Respond ONLY with valid JSON in this exact structure:
{
  "title": "<type>(<scope>): <concise imperative title under 72 chars>",
  "body": "- <bullet point detailing solution approach / algorithms used / time complexity>\n- <bullet point mentioning notes or optimizations added>"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return generateHeuristicCommitMessage(changes);
    }

    const parsed = JSON.parse(text);
    if (parsed && parsed.title) {
      return {
        title: parsed.title.trim(),
        body: (parsed.body || '').trim(),
      };
    }

    return generateHeuristicCommitMessage(changes);
  } catch (err) {
    console.warn('[AI Commit] Gemini API error, falling back to heuristic:', err.message);
    return generateHeuristicCommitMessage(changes);
  }
}
