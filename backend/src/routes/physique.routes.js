import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  addPhysiqueLog,
  getAllPhysiqueLogs,
  getPhysiqueProgress,
  deletePhysiqueLog,
} from '../controllers/physique.controller.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAllPhysiqueLogs)
  .post(addPhysiqueLog);

router.get('/progress', getPhysiqueProgress);

router.delete('/:id', deletePhysiqueLog);

export default router;
