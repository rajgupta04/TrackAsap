import request from 'supertest';
import app from '../src/app.js';
import { createTestUser } from './setup.js';
import CustomTask from '../src/models/CustomTask.model.js';

describe('Task Endpoints (/api/tasks)', () => {
  describe('POST /api/tasks', () => {
    it('should create a new task for authenticated user', async () => {
      const { user, token } = await createTestUser();

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Solve 3 LeetCode Hard Problems',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe('Solve 3 LeetCode Hard Problems');
      expect(res.body.user).toBe(user._id.toString());

      // DB check
      const dbTask = await CustomTask.findById(res.body._id);
      expect(dbTask).toBeDefined();
    });

    it('should reject duplicate task title for the same user', async () => {
      const { token } = await createTestUser();

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Read System Design Chapter' });

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Read System Design Chapter' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Anonymous Task' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/tasks', () => {
    it('should only return tasks belonging to the requesting user', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' });
      const user2 = await createTestUser({ email: 'user2@example.com' });

      // Create tasks for user1
      await CustomTask.create({ user: user1.user._id, title: 'User 1 Task A' });
      await CustomTask.create({ user: user1.user._id, title: 'User 1 Task B' });

      // Create task for user2
      await CustomTask.create({ user: user2.user._id, title: 'User 2 Secret Task' });

      // Fetch as user1
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user1.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(2);
      const titles = res.body.map((t) => t.title);
      expect(titles).toContain('User 1 Task A');
      expect(titles).toContain('User 1 Task B');
      expect(titles).not.toContain('User 2 Secret Task');
    });
  });

  describe('POST /api/tasks/toggle', () => {
    it('should toggle task completion status for a specific date', async () => {
      const { user, token } = await createTestUser();
      const task = await CustomTask.create({ user: user._id, title: 'Daily Workout' });

      const today = new Date().toISOString().split('T')[0];

      // First toggle -> completed: true
      const res1 = await request(app)
        .post('/api/tasks/toggle')
        .set('Authorization', `Bearer ${token}`)
        .send({ taskId: task._id, date: today });

      expect(res1.statusCode).toBe(200);
      expect(res1.body.completed).toBe(true);

      // Second toggle -> completed: false
      const res2 = await request(app)
        .post('/api/tasks/toggle')
        .set('Authorization', `Bearer ${token}`)
        .send({ taskId: task._id, date: today });

      expect(res2.statusCode).toBe(200);
      expect(res2.body.completed).toBe(false);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete existing task and return success', async () => {
      const { user, token } = await createTestUser();
      const task = await CustomTask.create({ user: user._id, title: 'Task To Delete' });

      const res = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);

      const dbCheck = await CustomTask.findById(task._id);
      expect(dbCheck).toBeNull();
    });
  });
});
