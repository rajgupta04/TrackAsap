import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.middleware.js';
import {
  getSheetProblems,
  addSheetProblem,
  updateProblemStatus,
  updateSheetProblem,
  deleteSheetProblem,
  importFromExcel,
  exportToExcel,
  getExcelTemplate,
} from '../controllers/sheetProblem.controller.js';

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept Excel files
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
  },
});

router.use(protect);

// Template download (before :sheetId routes)
router.get('/template', getExcelTemplate);

// Sheet problems routes
router.route('/:sheetId')
  .get(getSheetProblems)
  .post(addSheetProblem);

// Import/Export
router.post('/:sheetId/import', upload.single('file'), importFromExcel);
router.get('/:sheetId/export', exportToExcel);

// Single problem routes
router.route('/problem/:id')
  .put(updateSheetProblem)
  .delete(deleteSheetProblem);

router.patch('/problem/:id/status', updateProblemStatus);

export default router;
