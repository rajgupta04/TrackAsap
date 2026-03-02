import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { buildProblemKey, inferPlatform, normalizePlatform } from '../utils/problemIdentity.js';

const SOURCE_URL = 'https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'striverA2Z.snapshot.json');

const CATEGORY_MAP = [
  { match: /binary search/i, category: 'binary-search', icon: 'Search', color: '#14B8A6' },
  { match: /array/i, category: 'arrays', icon: 'LayoutList', color: '#10B981' },
  { match: /string/i, category: 'strings', icon: 'Text', color: '#EC4899' },
  { match: /linkedlist|linked list/i, category: 'linked-list', icon: 'Link', color: '#6366F1' },
  { match: /stack|queue/i, category: 'stack-queue', icon: 'Layers', color: '#F97316' },
  { match: /tree/i, category: 'trees', icon: 'Trees', color: '#22C55E' },
  { match: /graph/i, category: 'graph', icon: 'Network', color: '#8B5CF6' },
  { match: /dynamic programming|\bdp\b/i, category: 'dp', icon: 'Boxes', color: '#F59E0B' },
  { match: /greedy/i, category: 'greedy', icon: 'Target', color: '#EF4444' },
  { match: /trie/i, category: 'strings', icon: 'GitBranch', color: '#06B6D4' },
  { match: /bit/i, category: 'bit-manipulation', icon: 'Cpu', color: '#A855F7' },
  { match: /recursion|backtracking/i, category: 'backtracking', icon: 'Repeat', color: '#F43F5E' },
  { match: /heap/i, category: 'other', icon: 'Package', color: '#0EA5E9' },
];

function cleanText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function slug(value = '') {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toUrl(value = '') {
  const raw = cleanText(value);
  if (!raw || raw === '$undefined') return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/')) return `https://takeuforward.org${raw}`;
  return '';
}

function normalizeDifficulty(value = '') {
  const v = cleanText(value).toLowerCase();
  if (v === 'easy' || v === 'medium' || v === 'hard') return v;
  return 'medium';
}

function selectCategoryMeta(categoryName = '') {
  const hit = CATEGORY_MAP.find((entry) => entry.match.test(categoryName));
  return hit || { category: 'other', icon: 'BookOpen', color: '#00FF88' };
}

function chooseProblemLink(problem) {
  const leetcode = toUrl(problem.leetcode);
  const direct = toUrl(problem.link);
  const plus = toUrl(problem.plus);
  const article = toUrl(problem.article);

  if (leetcode) return leetcode;
  if (direct) return direct;
  if (plus) return plus;
  if (article) return article;
  return '';
}

function extractSegmentsFromHtml(html) {
  const regex = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)<\/script>/g;
  const segments = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    try {
      const decoded = JSON.parse(`"${match[1]}"`);
      segments.push(decoded);
    } catch {
      continue;
    }
  }

  return segments.join('');
}

function findSectionsArray(stream) {
  const marker = '"sections":[';
  const markerIndex = stream.indexOf(marker);

  if (markerIndex === -1) {
    throw new Error('Could not locate sections array in source stream');
  }

  const start = markerIndex + marker.length - 1;
  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let index = start; index < stream.length; index += 1) {
    const char = stream[index];

    if (inString) {
      if (escaping) {
        escaping = false;
      } else if (char === '\\') {
        escaping = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '[') {
      depth += 1;
      continue;
    }

    if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        return stream.slice(start, index + 1);
      }
    }
  }

  throw new Error('Could not parse sections array boundaries');
}

function parseSections(html) {
  const stream = extractSegmentsFromHtml(html);
  const sectionsJson = findSectionsArray(stream);
  return JSON.parse(sectionsJson);
}

function transformToSnapshot(sections) {
  const buckets = sections.map((section) => {
    const categoryName = cleanText(section.category_name || 'A2Z Category');
    const meta = selectCategoryMeta(categoryName);

    let order = 1;
    const seenKeys = new Set();
    const problems = [];

    for (const subcategory of section.subcategories || []) {
      const topicName = cleanText(subcategory.subcategory_name || 'General');

      for (const problem of subcategory.problems || []) {
        const title = cleanText(problem.problem_name || 'Untitled Problem');
        const articleLink = toUrl(problem.article);
        const youtubeLink = toUrl(problem.youtube);
        const problemLink = chooseProblemLink(problem);
        const platform = normalizePlatform(inferPlatform(problemLink));
        const difficulty = normalizeDifficulty(problem.difficulty);
        const problemKey = buildProblemKey({ title, problemLink, platform });

        if (!title || !problemKey || seenKeys.has(problemKey)) {
          continue;
        }

        seenKeys.add(problemKey);

        problems.push({
          title,
          topic: topicName,
          difficulty,
          problemLink,
          articleLink,
          youtubeLink,
          platform,
          tags: ['striver-a2z', slug(categoryName), slug(topicName)].filter(Boolean),
          order,
          problemKey,
        });

        order += 1;
      }
    }

    return {
      name: `A2Z ${categoryName}`,
      description: `Striver A2Z - ${categoryName}`,
      category: meta.category,
      icon: meta.icon,
      color: meta.color,
      problems,
    };
  }).filter((bucket) => bucket.problems.length > 0);

  return {
    schemaVersion: 1,
    source: 'striver-a2z',
    version: new Date().toISOString().slice(0, 10),
    sourceUrl: SOURCE_URL,
    generatedAt: new Date().toISOString(),
    notes: 'Auto-generated metadata snapshot from Striver A2Z source stream. Includes titles, topic grouping, and links only.',
    buckets,
  };
}

async function main() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; TrackAsap-A2Z-Importer/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch source page (${response.status})`);
  }

  const html = await response.text();
  const sections = parseSections(html);
  const snapshot = transformToSnapshot(sections);

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  const totalProblems = snapshot.buckets.reduce((sum, bucket) => sum + bucket.problems.length, 0);

  console.log(chalk.green.bold('✅ Generated snapshot file:'), chalk.cyan(OUTPUT_PATH));
  console.log(chalk.blue('Buckets:'), chalk.yellow(snapshot.buckets.length));
  console.log(chalk.blue('Problems:'), chalk.yellow(totalProblems));
}

main().catch((error) => {
  console.error(chalk.red.bold('❌ Extraction failed:'), chalk.red(error.message));
  process.exit(1);
});
