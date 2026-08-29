import request from 'supertest';
import app from '../src/app.js';
import { createTestUser } from './setup.js';
import Sheet from '../src/models/Sheet.model.js';
import SheetProblem from '../src/models/SheetProblem.model.js';

describe('Sheets & Sheet Problems Endpoints', () => {
  describe('POST /api/sheets', () => {
    it('should create a custom problem sheet', async () => {
      const { user, token } = await createTestUser();

      const res = await request(app)
        .post('/api/sheets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Striver SDE Sheet 2026',
          category: 'dsa',
          description: 'Top 180 curated problems',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Striver SDE Sheet 2026');
      expect(res.body.user).toBe(user._id.toString());
    });
  });

  describe('GET /api/sheets', () => {
    it('should list all sheets owned by the authenticated user', async () => {
      const { user, token } = await createTestUser();
      await Sheet.create({ user: user._id, name: 'Sheet A', category: 'dsa' });
      await Sheet.create({ user: user._id, name: 'Sheet B', category: 'cp' });

      const res = await request(app)
        .get('/api/sheets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(2);
    });
  });

  describe('POST /api/sheet-problems/:sheetId', () => {
    it('should add a problem to an existing sheet', async () => {
      const { user, token } = await createTestUser();
      const sheet = await Sheet.create({ user: user._id, name: 'Blind 75', category: 'dsa' });

      const res = await request(app)
        .post(`/api/sheet-problems/${sheet._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Two Sum',
          topic: 'Arrays',
          difficulty: 'easy',
          problemLink: 'https://leetcode.com/problems/two-sum/',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe('Two Sum');
      expect(res.body.sheet.toString()).toBe(sheet._id.toString());

      const dbProblem = await SheetProblem.findById(res.body._id);
      expect(dbProblem).toBeDefined();
    });
  });

  describe('DELETE /api/sheets/:id', () => {
    it('should delete a sheet and its associated problems', async () => {
      const { user, token } = await createTestUser();
      const sheet = await Sheet.create({ user: user._id, name: 'Temp Sheet', category: 'dsa' });
      await SheetProblem.create({
        sheet: sheet._id,
        user: user._id,
        title: 'Problem 1',
        topic: 'Arrays',
      });

      const res = await request(app)
        .delete(`/api/sheets/${sheet._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);

      const dbSheet = await Sheet.findById(sheet._id);
      expect(dbSheet).toBeNull();
    });
  });
});
