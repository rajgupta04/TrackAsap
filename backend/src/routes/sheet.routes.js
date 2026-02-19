import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  createSheet,
  getSheets,
  getSheet,
  updateSheet,
  deleteSheet,
  addTopic,
  updateTopicProgress,
  getTemplates,
} from '../controllers/sheet.controller.js';

const router = express.Router();

router.use(protect);

router.get('/templates', getTemplates);

router.route('/')
  .get(getSheets)
  .post(createSheet);

router.route('/:id')
  .get(getSheet)
  .put(updateSheet)
  .delete(deleteSheet);

router.post('/:id/topics', addTopic);
router.put('/:id/topics/:topicName', updateTopicProgress);

export default router;
