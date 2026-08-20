import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import connectDB from '../src/config/db.js';
import RoadmapWorld from '../src/models/RoadmapWorld.model.js';
import { WORLDS } from '../../frontend/src/data/roadmapData.js';

const seedRoadmaps = async () => {
  try {
    await connectDB();
    console.log('MongoDB Connected for Roadmap seeding...');
    console.log(`Loaded ${WORLDS.length} worlds from roadmapData.js`);

    for (let i = 0; i < WORLDS.length; i++) {
      const world = WORLDS[i];
      const upsertData = {
        ...world,
        order: i,
        isActive: true,
      };

      const result = await RoadmapWorld.findOneAndUpdate(
        { id: world.id },
        { $set: upsertData },
        { upsert: true, new: true }
      );

      console.log(`✔ Synced World [${i + 1}/${WORLDS.length}]: ${result.name} (${result.problems?.length || 0} problems)`);
    }

    console.log('\n🎉 All Roadmap Worlds successfully seeded into Cosmos DB!');
    process.exit(0);
  } catch (error) {
    console.error('Seed roadmap error:', error);
    process.exit(1);
  }
};

seedRoadmaps();
