import express from 'express';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';
import {
  getUsers,
  toggleBanUser,
  adminDeletePost,
  getAdminStats,
  getUserDetails,
  getCompilerSettings,
  updateCompilerSettings,
} from '../controllers/admin.controller.js';
import {
  getAdminRoadmapWorlds,
  upsertRoadmapWorld,
  deleteRoadmapWorld,
  seedRoadmapWorlds,
} from '../controllers/roadmapAdmin.controller.js';

import {
  getAdminFeatures,
  updateAdminFeatures,
} from '../controllers/feature.controller.js';
import {
  getLiveClickstream,
  getUserJourney,
  getIpStats,
  getTopClicks,
} from '../controllers/telemetry.controller.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect);
router.use(requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users/:id/details', getUserDetails);
router.get('/users', getUsers);
router.put('/users/:id/ban', toggleBanUser);
router.delete('/posts/:id', adminDeletePost);

// Telemetry, Clickstream, & IP Analytics
router.get('/telemetry/clickstream', getLiveClickstream);
router.get('/telemetry/user-journey/:email', getUserJourney);
router.get('/telemetry/ip-stats', getIpStats);
router.get('/telemetry/top-clicks', getTopClicks);

// Feature Switches & Section Visibility
router.get('/features', getAdminFeatures);
router.put('/features', updateAdminFeatures);

// Compiler Control & Rate Limiting
router.get('/compiler-settings', getCompilerSettings);
router.put('/compiler-settings', updateCompilerSettings);

// Roadmap World Management
router.get('/roadmap/worlds', getAdminRoadmapWorlds);
router.post('/roadmap/worlds', upsertRoadmapWorld);
router.delete('/roadmap/worlds/:id', deleteRoadmapWorld);
router.post('/roadmap/seed', seedRoadmapWorlds);

export default router;
