import request from 'supertest';
import app from '../src/app.js';
import { createTestUser } from './setup.js';
import DailyPlan from '../src/models/DailyPlan.model.js';

describe('Daily Plan Endpoints (/api/daily-plan)', () => {
  describe('POST /api/daily-plan/save', () => {
    it('should save a valid daily plan for user', async () => {
      const { user, token } = await createTestUser();

      const planData = {
        date: new Date().toISOString().split('T')[0],
        totalAvailableMinutes: 180,
        mode: 'standard',
        tasks: [
          {
            id: 'task_1',
            title: 'Dynamic Programming',
            time: '09:00 - 10:30',
            durationMinutes: 90,
            category: 'study',
            completed: false,
          },
          {
            id: 'task_2',
            title: 'Coffee Break',
            time: '10:30 - 10:45',
            durationMinutes: 15,
            category: 'break',
            completed: false,
          },
        ],
      };

      const res = await request(app)
        .post('/api/daily-plan/save')
        .set('Authorization', `Bearer ${token}`)
        .send({
          mode: 'grind',
          totalHours: 3,
          chosenPlan: planData,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.plan.tasks.length).toBe(2);
      expect(res.body.status).toBe('draft');
      expect(res.body.user.toString()).toBe(user._id.toString());
    });
  });

  describe('PATCH /api/daily-plan/:id/start-session and toggle-task', () => {
    it('should start a session and toggle completed task', async () => {
      const { user, token } = await createTestUser();

      const planDoc = await DailyPlan.create({
        user: user._id,
        date: new Date().toISOString().split('T')[0],
        status: 'draft',
        mode: 'grind',
        totalHours: 2,
        plan: {
          totalAvailableMinutes: 120,
          mode: 'standard',
          tasks: [
            {
              id: 'task_10',
              title: 'Graph Traversal Practice',
              duration: 60,
              category: 'study',
              completed: false,
            },
          ],
        },
      });

      // Start Session
      const startRes = await request(app)
        .patch(`/api/daily-plan/${planDoc._id}/start-session`)
        .set('Authorization', `Bearer ${token}`)
        .send({ mode: 'standard' });

      expect(startRes.statusCode).toBe(200);
      expect(startRes.body.status).toBe('active');
      expect(startRes.body.sessionStartedAt).toBeDefined();

      // Toggle Task
      const toggleRes = await request(app)
        .patch(`/api/daily-plan/${planDoc._id}/toggle-task`)
        .set('Authorization', `Bearer ${token}`)
        .send({ taskId: 'task_10' });

      expect(toggleRes.statusCode).toBe(200);
      const targetTask = toggleRes.body.plan.tasks.find((t) => t.id === 'task_10');
      expect(targetTask.completed).toBe(true);
    });
  });
});
