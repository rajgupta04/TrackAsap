import request from 'supertest';
import app from '../src/app.js';
import { createTestUser } from './setup.js';
import LeaderboardProfile from '../src/models/LeaderboardProfile.model.js';

describe('Leaderboard Endpoints (/api/leaderboard)', () => {
  describe('GET /api/leaderboard/global', () => {
    it('should return paginated global leaderboard ranked by score', async () => {
      const u1 = await createTestUser({ name: 'Leader One' });
      const u2 = await createTestUser({ name: 'Leader Two' });

      await LeaderboardProfile.create({
        user: u1.user._id,
        globalScore: 1200,
        weeklyScore: 400,
      });

      await LeaderboardProfile.create({
        user: u2.user._id,
        globalScore: 2500,
        weeklyScore: 800,
      });

      const res = await request(app).get('/api/leaderboard/global');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.leaderboard || res.body)).toBe(true);
      const list = res.body.leaderboard || res.body;
      expect(list.length).toBeGreaterThanOrEqual(2);
      // Higher score first
      expect(list[0].globalScore).toBeGreaterThanOrEqual(list[1].globalScore);
    });
  });

  describe('GET /api/leaderboard/me', () => {
    it('should return current logged in user rank and profile', async () => {
      const { user, token } = await createTestUser();

      await LeaderboardProfile.create({
        user: user._id,
        globalScore: 1500,
        weeklyScore: 500,
        monthlyScore: 1000,
      });

      const res = await request(app)
        .get('/api/leaderboard/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.profile).toBeDefined();
      expect(res.body.profile.globalScore).toBe(1500);
    });

    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/leaderboard/me');
      expect(res.statusCode).toBe(401);
    });
  });
});
