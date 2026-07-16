import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configure dotenv to run from backend root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import connectDB from '../src/config/db.js';
import User from '../src/models/User.model.js';
import Sheet from '../src/models/Sheet.model.js';
import SheetProblem from '../src/models/SheetProblem.model.js';
import redisClient from '../src/config/redis.js';

const ROOT_DIR = 'S:/Workplace/leetcode-company-wise-problems-main';

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

// Colors to randomly assign to sheets so they look nice in the UI
const colors = ['#39FF14', '#00FFFF', '#FF00FF', '#FFFF00', '#FF4500', '#1E90FF'];

const importCompanySheets = async () => {
  try {
    await connectDB();
    console.log('MongoDB Connected');

    // 1. Ensure Admin User Exists
    let adminUser = await User.findOne({ email: 'admin@trackasap.com' });
    if (!adminUser) {
      console.log('Admin user not found. Creating admin user...');
      adminUser = await User.create({
        name: 'TrackAsap System',
        email: 'admin@trackasap.com',
        password: 'Rajan@8340@', // Will be hashed by pre-save hook
        role: 'admin',
        isVerified: true,
      });
    }
    console.log('Admin User ID:', adminUser._id);

    // 2. Iterate through company folders
    const items = fs.readdirSync(ROOT_DIR);
    const companies = items.filter(item => {
      return fs.statSync(path.join(ROOT_DIR, item)).isDirectory();
    });

    console.log(`Found ${companies.length} companies to process.`);

    for (const company of companies) {
      const csvPath = path.join(ROOT_DIR, company, '5. All.csv');
      
      if (!fs.existsSync(csvPath)) {
        console.warn(`Skipping ${company} - No '5. All.csv' found.`);
        continue;
      }

      console.log(`Processing ${company}...`);
      const problems = await parseCSV(csvPath);
      
      if (problems.length === 0) continue;

      // Check if sheet already exists to avoid duplicates if run multiple times
      let sheet = await Sheet.findOne({
        name: `${company} Top Problems`,
        category: 'company-wise',
        isTemplate: true
      });

      if (sheet) {
        // If it exists, let's delete its old problems and re-insert to refresh
        await SheetProblem.deleteMany({ sheet: sheet._id });
      } else {
        // Create new Sheet Template
        sheet = await Sheet.create({
          user: adminUser._id,
          name: `${company} Top Problems`,
          description: `Most frequently asked problems at ${company} globally.`,
          category: 'company-wise',
          color: colors[Math.floor(Math.random() * colors.length)],
          icon: 'building',
          isTemplate: true,
          isActive: true,
          topics: [{ name: 'All Problems', order: 1 }],
          totalProblems: problems.length,
          solvedProblems: 0,
        });
      }

      // Prepare problems for bulk insert
      const sheetProblemsData = problems.map((row, index) => {
        // row format: Difficulty,Title,Frequency,Acceptance Rate,Link,Topics
        const difficulty = row.Difficulty ? row.Difficulty.toLowerCase() : 'medium';
        const title = row.Title || 'Unknown Problem';
        const link = row.Link || '';
        const tags = row.Topics ? row.Topics.split(',').map(t => t.trim()) : [];

        // Generate a problemKey from URL if possible
        let problemKey = '';
        if (link.includes('leetcode.com/problems/')) {
          problemKey = link.split('leetcode.com/problems/')[1].replace('/', '');
        } else {
          problemKey = title.toLowerCase().replace(/\s+/g, '-');
        }

        return {
          user: adminUser._id,
          sheet: sheet._id,
          title: title,
          topic: 'All Problems',
          problemNumber: index + 1,
          difficulty: difficulty,
          problemLink: link,
          problemKey: problemKey,
          platform: 'leetcode',
          tags: tags,
          order: index + 1,
        };
      });

      // Bulk Insert
      await SheetProblem.insertMany(sheetProblemsData);
      
      // We rely on the standard application routes to cache it when first requested, 
      // or we can optionally purge all 'sheets:templates' keys from Redis here.
      // Since it's an initial seed, it's fine.
    }

    console.log('✅ Successfully imported all company-wise sheets!');

    // Close connections
    if (redisClient) {
      await redisClient.quit();
    }
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  }
};

importCompanySheets();
