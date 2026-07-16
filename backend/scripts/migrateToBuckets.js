import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Configure dotenv to run from backend root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import connectDB from '../src/config/db.js';
import Sheet from '../src/models/Sheet.model.js';
import SheetProblem from '../src/models/SheetProblem.model.js';
import SheetBucket from '../src/models/SheetBucket.model.js';
import redisClient from '../src/config/redis.js';

const migrate = async () => {
  try {
    await connectDB();
    console.log('MongoDB Connected');

    const templates = await Sheet.find({ category: 'company-wise', isTemplate: true });
    console.log(`Found ${templates.length} company sheets to migrate.`);

    for (const sheet of templates) {
      const problems = await SheetProblem.find({ sheet: sheet._id });
      
      const bucketProblems = problems.map(p => ({
        title: p.title,
        topic: p.topic || 'All Problems',
        difficulty: p.difficulty,
        problemLink: p.problemLink,
        articleLink: p.articleLink,
        youtubeLink: p.youtubeLink,
        problemKey: p.problemKey,
        platform: p.platform,
        tags: p.tags,
        order: p.order
      }));

      // Calculate difficulty breakdown
      const easy = problems.filter(p => p.difficulty === 'easy').length;
      const medium = problems.filter(p => p.difficulty === 'medium').length;
      const hard = problems.filter(p => p.difficulty === 'hard').length;

      const topics = [...new Set(problems.map(p => p.topic).filter(Boolean))];

      await SheetBucket.findOneAndUpdate(
        { name: sheet.name },
        {
          name: sheet.name,
          description: sheet.description,
          category: 'company-wise', // Make sure this enum exists in SheetBucket
          icon: 'Building',
          color: sheet.color,
          problems: bucketProblems,
          totalProblems: problems.length,
          difficultyBreakdown: { easy, medium, hard },
          topics: topics,
          isActive: true
        },
        { upsert: true, new: true }
      );

      console.log(`Migrated ${sheet.name}`);
    }

    // Clean up the wrong models
    const templateIds = templates.map(t => t._id);
    await SheetProblem.deleteMany({ sheet: { $in: templateIds } });
    await Sheet.deleteMany({ _id: { $in: templateIds } });

    console.log('Cleanup complete.');

    if (redisClient) {
      await redisClient.flushall();
    }
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

migrate();
