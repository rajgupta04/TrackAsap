import fs from 'fs/promises';
import path from 'path';
import SheetBucket from '../models/SheetBucket.model.js';
import {
  assertCategory,
  assertDifficulty,
  STRIVER_SNAPSHOT_SCHEMA_VERSION,
} from './striverA2Z.schema.js';
import { buildProblemKey, inferPlatform, normalizePlatform } from '../utils/problemIdentity.js';

function normalizeTopic(value = '') {
  return String(value).trim() || 'General';
}

function normalizeTags(tags = []) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))];
}

function normalizeDifficulty(value = '') {
  const difficulty = String(value || 'medium').trim().toLowerCase();
  return assertDifficulty(difficulty) ? difficulty : 'medium';
}

function normalizeProblem(problem, orderFallback = 0) {
  const title = String(problem.title || '').trim();
  const topic = normalizeTopic(problem.topic);
  const difficulty = normalizeDifficulty(problem.difficulty);
  const problemLink = String(problem.problemLink || '').trim();
  const articleLink = String(problem.articleLink || '').trim();
  const youtubeLink = String(problem.youtubeLink || '').trim();
  const platform = normalizePlatform(problem.platform || inferPlatform(problemLink));
  const order = Number.isFinite(problem.order) ? problem.order : orderFallback;
  const tags = normalizeTags(problem.tags);
  const problemKey = problem.problemKey || buildProblemKey({ title, problemLink, platform });

  return {
    title,
    topic,
    difficulty,
    problemLink,
    articleLink,
    youtubeLink,
    platform,
    order,
    tags,
    problemKey,
  };
}

function normalizeBucket(bucket) {
  const normalizedBucket = {
    name: String(bucket.name || '').trim(),
    description: String(bucket.description || '').trim(),
    category: String(bucket.category || 'other').trim().toLowerCase(),
    icon: String(bucket.icon || 'BookOpen').trim(),
    color: String(bucket.color || '#00FF88').trim(),
    problems: [],
  };

  if (!assertCategory(normalizedBucket.category)) {
    normalizedBucket.category = 'other';
  }

  const seenKeys = new Set();
  (bucket.problems || []).forEach((problem, index) => {
    const normalizedProblem = normalizeProblem(problem, index);
    if (!normalizedProblem.title || !normalizedProblem.problemKey) {
      return;
    }

    if (seenKeys.has(normalizedProblem.problemKey)) {
      return;
    }

    seenKeys.add(normalizedProblem.problemKey);
    normalizedBucket.problems.push(normalizedProblem);
  });

  return normalizedBucket;
}

export async function loadAndValidateSnapshot(snapshotPath) {
  const absolutePath = path.resolve(snapshotPath);
  const raw = await fs.readFile(absolutePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Snapshot must be a JSON object');
  }

  if (!Array.isArray(parsed.buckets)) {
    throw new Error('Snapshot must contain a buckets array');
  }

  if (
    parsed.schemaVersion !== undefined
    && Number(parsed.schemaVersion) !== STRIVER_SNAPSHOT_SCHEMA_VERSION
  ) {
    throw new Error(
      `Unsupported schemaVersion ${parsed.schemaVersion}. Expected ${STRIVER_SNAPSHOT_SCHEMA_VERSION}.`
    );
  }

  const normalizedBuckets = parsed.buckets
    .map(normalizeBucket)
    .filter((bucket) => bucket.name && bucket.problems.length > 0);

  return {
    source: parsed.source || 'striver-a2z',
    version: parsed.version || 'snapshot',
    schemaVersion: parsed.schemaVersion || STRIVER_SNAPSHOT_SCHEMA_VERSION,
    buckets: normalizedBuckets,
  };
}

export async function importA2ZSnapshot({ snapshotPath, dryRun = false }) {
  const snapshot = await loadAndValidateSnapshot(snapshotPath);

  const summary = {
    source: snapshot.source,
    version: snapshot.version,
    buckets: snapshot.buckets.length,
    totalProblems: snapshot.buckets.reduce((count, bucket) => count + bucket.problems.length, 0),
    upserted: 0,
    skipped: 0,
  };

  if (dryRun) {
    return summary;
  }

  for (const bucket of snapshot.buckets) {
    await SheetBucket.findOneAndUpdate(
      { name: bucket.name },
      {
        name: bucket.name,
        description: bucket.description,
        category: bucket.category,
        icon: bucket.icon,
        color: bucket.color,
        problems: bucket.problems,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    summary.upserted += 1;
  }

  return summary;
}
