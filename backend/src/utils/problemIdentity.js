export const SUPPORTED_PLATFORMS = [
  'leetcode',
  'geeksforgeeks',
  'codechef',
  'codeforces',
  'hackerrank',
  'interviewbit',
  'codingninjas',
  'atcoder',
  'spoj',
  'other',
];

function normalizeText(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeUrl(value = '') {
  if (!value) return '';

  try {
    const parsed = new URL(value.trim());
    const pathname = parsed.pathname.replace(/\/+$/, '').toLowerCase();
    return `${parsed.hostname.toLowerCase()}${pathname}`;
  } catch {
    return '';
  }
}

export function normalizePlatform(value = '') {
  const normalized = normalizeText(value);
  if (SUPPORTED_PLATFORMS.includes(normalized)) {
    return normalized;
  }
  return 'other';
}

export function buildProblemKey({ title = '', problemLink = '', platform = '' }) {
  const normalizedPlatform = normalizePlatform(platform || inferPlatform(problemLink));
  const normalizedUrl = normalizeUrl(problemLink);

  if (normalizedUrl) {
    return `${normalizedPlatform}:${normalizedUrl}`;
  }

  const normalizedTitle = normalizeText(title);
  return normalizedTitle ? `${normalizedPlatform}:title:${normalizedTitle}` : '';
}

export function inferPlatform(problemLink = '') {
  const link = String(problemLink || '').toLowerCase();

  if (link.includes('leetcode.com')) return 'leetcode';
  if (link.includes('geeksforgeeks.org')) return 'geeksforgeeks';
  if (link.includes('codechef.com')) return 'codechef';
  if (link.includes('codeforces.com')) return 'codeforces';
  if (link.includes('hackerrank.com')) return 'hackerrank';
  if (link.includes('interviewbit.com')) return 'interviewbit';
  if (link.includes('naukri.com/code360') || link.includes('codingninjas.com')) return 'codingninjas';
  if (link.includes('atcoder.jp')) return 'atcoder';
  if (link.includes('spoj.com')) return 'spoj';

  return 'other';
}
