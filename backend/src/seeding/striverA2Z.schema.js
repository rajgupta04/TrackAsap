export const BUCKET_CATEGORIES = [
  'dsa',
  'graph',
  'dp',
  'trees',
  'strings',
  'arrays',
  'linked-list',
  'stack-queue',
  'binary-search',
  'greedy',
  'backtracking',
  'bit-manipulation',
  'math',
  'system-design',
  'other',
];

export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

export const STRIVER_SNAPSHOT_SCHEMA_VERSION = 1;

export function assertCategory(value) {
  return BUCKET_CATEGORIES.includes(value);
}

export function assertDifficulty(value) {
  return DIFFICULTY_LEVELS.includes(value);
}
