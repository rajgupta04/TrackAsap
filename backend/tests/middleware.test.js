import request from 'supertest';
import app from '../src/app.js';
import { createTestUser, createTestAdmin } from './setup.js';

describe('System Middlewares & Route Boundaries', () => {
  describe('404 Not Found Handler', () => {
    it('should return 404 with structured message for nonexistent routes', async () => {
      const res = await request(app).get('/api/random-nonexistent-endpoint-xyz');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });
  });

  describe('Admin Guard Middleware', () => {
    it('should block non-admin users from admin routes with 403', async () => {
      const { token } = await createTestUser({ role: 'user' });

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/admin/i);
    });

    it('should allow admin users access to admin routes', async () => {
      const { token } = await createTestAdmin();

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);

      // Should be 200 (or at least not 403 forbidden)
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.users || res.body)).toBe(true);
    });
  });

  describe('Banned User Account Locking', () => {
    it('should immediately block banned users with 403 and account lock message', async () => {
      const { token } = await createTestUser({ isBanned: true });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.banned).toBe(true);
      expect(res.body.message).toMatch(/banned/i);
    });
  });
});
