import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { importA2ZSnapshot } from './seeding/striverA2Z.importer.js';
import SheetBucket from './models/SheetBucket.model.js';
import { legacyBuckets } from './seeding/legacyBuckets.js';
import { buildProblemKey, inferPlatform, normalizePlatform } from './utils/problemIdentity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const includeLegacy = !args.includes('--skip-legacy');

  const fileArg = args.find((arg) => arg.startsWith('--file='));
  const filePathFromArg = fileArg ? fileArg.split('=')[1] : '';

  return {
    dryRun,
    includeLegacy,
    filePath: filePathFromArg || path.join(__dirname, 'data', 'striverA2Z.snapshot.json'),
  };
}

function normalizeLegacyProblem(problem, index) {
  const title = String(problem.title || '').trim();
  const problemLink = String(problem.problemLink || '').trim();
  const platform = normalizePlatform(problem.platform || inferPlatform(problemLink));

  return {
    title,
    topic: String(problem.topic || 'General').trim(),
    difficulty: ['easy', 'medium', 'hard'].includes(String(problem.difficulty || '').toLowerCase())
      ? String(problem.difficulty).toLowerCase()
      : 'medium',
    problemLink,
    articleLink: String(problem.articleLink || '').trim(),
    youtubeLink: String(problem.youtubeLink || '').trim(),
    platform,
    tags: Array.isArray(problem.tags) ? problem.tags : [],
    order: Number.isFinite(problem.order) ? problem.order : index,
    problemKey: problem.problemKey || buildProblemKey({ title, problemLink, platform }),
  };
}

async function upsertLegacyBuckets({ dryRun }) {
  const normalizedLegacyBuckets = legacyBuckets.map((bucket) => ({
    ...bucket,
    problems: (bucket.problems || [])
      .map((problem, index) => normalizeLegacyProblem(problem, index))
      .filter((problem) => problem.title && problem.problemKey),
  }));

  if (dryRun) {
    return {
      count: normalizedLegacyBuckets.length,
      problems: normalizedLegacyBuckets.reduce((sum, bucket) => sum + bucket.problems.length, 0),
    };
  }

  for (const bucket of normalizedLegacyBuckets) {
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
  }

  return {
    count: normalizedLegacyBuckets.length,
    problems: normalizedLegacyBuckets.reduce((sum, bucket) => sum + bucket.problems.length, 0),
  };
}

async function run() {
  const { dryRun, includeLegacy, filePath } = parseArgs();

  try {
    if (!dryRun && !process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required in backend/.env');
    }

    if (!dryRun) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');
    }

    const summary = await importA2ZSnapshot({
      snapshotPath: filePath,
      dryRun,
    });

    const legacySummary = includeLegacy
      ? await upsertLegacyBuckets({ dryRun })
      : { count: 0, problems: 0 };

    console.log('--- A2Z Import Summary ---');
    console.log(`Source: ${summary.source}`);
    console.log(`Version: ${summary.version}`);
    console.log(`Buckets in snapshot: ${summary.buckets}`);
    console.log(`Problems in snapshot: ${summary.totalProblems}`);
    if (includeLegacy) {
      console.log(`Legacy buckets upserted: ${legacySummary.count}`);
      console.log(`Legacy problems upserted: ${legacySummary.problems}`);
    }

    if (dryRun) {
      console.log('Dry run complete. No database changes were made.');
    } else {
      console.log(`Buckets upserted: ${summary.upserted}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

run();
