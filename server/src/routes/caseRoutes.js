import { Router } from 'express';
import { createCase, getCases, getCaseById, updateCase, getCaseActivity } from '../controllers/caseController.js';
import { uploadEvidence, getEvidenceByCase } from '../controllers/evidenceController.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadEvidence as uploadMiddleware } from '../middleware/upload.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getCases);
router.post('/', createCase);
router.get('/:id', getCaseById);
router.put('/:id', updateCase);
router.get('/:id/activity', getCaseActivity);

// Evidence sub-routes for cases
router.get('/:caseId/evidence', getEvidenceByCase);
router.post('/:caseId/evidence', uploadMiddleware.single('file'), uploadEvidence);

export default router;
