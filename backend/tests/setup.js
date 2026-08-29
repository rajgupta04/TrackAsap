import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.model.js';

let mongoServer;

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_trackasap_testing_12345';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

/**
 * Test Helper: Create a verified test user with token
 */
export const createTestUser = async (overrides = {}) => {
  const uniqueId = Math.random().toString(36).substring(2, 9);
  const password = overrides.password || 'Test@123456';
  
  const user = await User.create({
    name: overrides.name || `Test User ${uniqueId}`,
    email: overrides.email || `user_${uniqueId}@example.com`,
    password,
    role: overrides.role || 'user',
    isEmailVerified: overrides.isEmailVerified !== undefined ? overrides.isEmailVerified : true,
    acceptedDiscussionAgreement: overrides.acceptedDiscussionAgreement !== undefined ? overrides.acceptedDiscussionAgreement : true,
    startDate: overrides.startDate || new Date(),
    authProvider: overrides.authProvider || 'local',
    ...overrides,
  });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

  return { user, token, rawPassword: password };
};

/**
 * Test Helper: Create an admin test user with token
 */
export const createTestAdmin = async (overrides = {}) => {
  return createTestUser({
    name: 'Admin Tester',
    email: `admin_${Math.random().toString(36).substring(2, 8)}@example.com`,
    role: 'admin',
    ...overrides,
  });
};
