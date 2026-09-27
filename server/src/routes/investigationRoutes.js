import { Router } from 'express';
import { 
  createInvestigation, 
  getInvestigations, 
  getInvestigationById, 
  updateInvestigation, 
  getInvestigationActivity 
} from '../controllers/investigationController.js';
import { 
  uploadDataSource, 
  getDataSourcesByInvestigation, 
  getNormalizedRecords 
} from '../controllers/dataSourceController.js';
import { 
  processEntities, 
  getMasterEntities, 
  getEntityStats, 
  getEntityReviewQueue 
} from '../controllers/entityController.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadEvidence as uploadMiddleware } from '../middleware/upload.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getInvestigations);
router.post('/', createInvestigation);
router.get('/:id', getInvestigationById);
router.put('/:id', updateInvestigation);
router.get('/:id/activity', getInvestigationActivity);

// Sub-routes for investigation data sources & normalized records
router.get('/:investigationId/data-sources', getDataSourcesByInvestigation);
router.post('/:investigationId/data-sources', uploadMiddleware.single('file'), uploadDataSource);
router.get('/:id/normalized-records', (req, res) => {
  const invId = req.params.id;
  req.params = {};
  req.query.investigation_id = invId;
  return getNormalizedRecords(req, res);
});

// Phase 2 Entity Intelligence Sub-routes
router.post('/:id/entities/process', processEntities);
router.get('/:id/entities', getMasterEntities);
router.get('/:id/entities/stats', getEntityStats);
router.get('/:id/entity-review-queue', getEntityReviewQueue);

export default router;
