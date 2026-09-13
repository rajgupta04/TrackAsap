import request from 'supertest';
import app from '../src/app.js';
import { createTestUser } from './setup.js';
import User from '../src/models/User.model.js';

describe('Auth Endpoints (POST/GET /api/auth)', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully with valid inputs', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Quality',
          email: 'alice.qa@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe('alice.qa@example.com');
      expect(res.body.name).toBe('Alice Quality');
      expect(res.body).not.toHaveProperty('password');

      // Verify stored in DB
      const dbUser = await User.findOne({ email: 'alice.qa@example.com' });
      expect(dbUser).toBeDefined();
      expect(dbUser.authProvider).toBe('local');
    });

    it('should return 400 when registering with an existing email', async () => {
      await createTestUser({ email: 'duplicate@example.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bob Duplicate',
          email: 'duplicate@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate user with valid credentials and return JWT token', async () => {
      const { user, rawPassword } = await createTestUser({
        email: 'tester.login@example.com',
        password: 'ValidSecret123!',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: rawPassword,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe(user.email);
    });

    it('should reject login with incorrect password with 401', async () => {
      const { user } = await createTestUser({
        email: 'tester.wrongpass@example.com',
        password: 'CorrectPassword123!',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'WrongPassword999!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it('should reject login for non-existent email with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return authenticated user profile when Bearer token is provided', async () => {
      const { user, token } = await createTestUser({
        name: 'Profile Tester',
        email: 'profile.tester@example.com',
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body._id).toBe(user._id.toString());
      expect(res.body.email).toBe('profile.tester@example.com');
      expect(res.body.name).toBe('Profile Tester');
    });

    it('should return 401 when no authorization token is provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it('should return 401 when an invalid/malformed token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_garbage_token_123');

      expect(res.statusCode).toBe(401);
    });
  });
});
