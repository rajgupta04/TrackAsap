import request from 'supertest';
import app from '../src/app.js';
import { createTestUser } from './setup.js';
import DiscussionPost from '../src/models/DiscussionPost.model.js';

describe('Discussion Endpoints (/api/discussions)', () => {
  describe('POST /api/discussions (Community Post Creation)', () => {
    it('should create a discussion post when user has verified email and accepted agreement', async () => {
      const { user, token } = await createTestUser({
        isEmailVerified: true,
        acceptedDiscussionAgreement: true,
      });

      const res = await request(app)
        .post('/api/discussions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Hello everyone! Starting Day 1 of the 75-day coding challenge 🚀',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.content).toContain('Day 1');
      expect(res.body.user._id.toString()).toBe(user._id.toString());
    });

    it('should block post creation if user has NOT accepted agreement (403)', async () => {
      const { token } = await createTestUser({
        isEmailVerified: true,
        acceptedDiscussionAgreement: false,
      });

      const res = await request(app)
        .post('/api/discussions')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Trying to post without agreement' });

      expect(res.statusCode).toBe(403);
      expect(res.body.requiresAgreement).toBe(true);
    });

    it('should block post creation if user email is unverified (403)', async () => {
      const { token } = await createTestUser({
        isEmailVerified: false,
        acceptedDiscussionAgreement: true,
      });

      const res = await request(app)
        .post('/api/discussions')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Trying to post with unverified email' });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/verify your email/i);
    });

    it('should reject empty post content with 400', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/discussions')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '   ' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/content is required/i);
    });
  });

  describe('POST /api/discussions/:id/like', () => {
    it('should toggle like on a post', async () => {
      const author = await createTestUser();
      const liker = await createTestUser();

      const post = await DiscussionPost.create({
        user: author.user._id,
        content: 'Great community post!',
      });

      // Like
      const res1 = await request(app)
        .post(`/api/discussions/${post._id}/like`)
        .set('Authorization', `Bearer ${liker.token}`);

      expect(res1.statusCode).toBe(200);
      expect(res1.body.liked).toBe(true);
      expect(res1.body.likesCount).toBe(1);

      // Unlike
      const res2 = await request(app)
        .post(`/api/discussions/${post._id}/like`)
        .set('Authorization', `Bearer ${liker.token}`);

      expect(res2.statusCode).toBe(200);
      expect(res2.body.liked).toBe(false);
      expect(res2.body.likesCount).toBe(0);
    });
  });
});
