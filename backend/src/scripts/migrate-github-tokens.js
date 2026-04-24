import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.model.js';
import { encryptText, isTokenEncryptionConfigured } from '../utils/crypto.js';

dotenv.config();

const run = async () => {
  try {
    if (!isTokenEncryptionConfigured()) {
      throw new Error('GITHUB_TOKEN_ENC_KEY is not set. Configure it before running migration.');
    }

    await connectDB();

    const users = await User.find({
      githubConnected: true,
      githubAccessToken: { $exists: true, $ne: '' },
    }).select('+githubAccessToken');

    if (users.length === 0) {
      console.log('ℹ️ No plaintext GitHub tokens found to migrate.');
      await mongoose.disconnect();
      process.exit(0);
    }

    const ops = users
      .map((u) => {
        if (!u.githubAccessToken) return null;

        const { encrypted, iv, tag } = encryptText(u.githubAccessToken);

        return {
          updateOne: {
            filter: { _id: u._id },
            update: {
              $set: {
                githubAccessTokenEnc: encrypted,
                githubAccessTokenIv: iv,
                githubAccessTokenTag: tag,
              },
              $unset: {
                githubAccessToken: '',
              },
            },
          },
        };
      })
      .filter(Boolean);

    if (ops.length > 0) {
      const result = await User.bulkWrite(ops);
      console.log(`✅ Migrated ${result.modifiedCount} GitHub token(s) to encrypted storage`);
    } else {
      console.log('ℹ️ No valid plaintext tokens to migrate.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Token migration failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();
