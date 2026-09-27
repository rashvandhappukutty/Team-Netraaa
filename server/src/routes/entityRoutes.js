import { Router } from 'express';
import { 
  processEntities, 
  getMasterEntities, 
  getAllMasterEntities, 
  getEntityStats, 
  getEntityProfile, 
  getEntityReviewQueue, 
  confirmEntityMerge, 
  keepEntitySeparate, 
  editCanonicalName, 
  rejectEntityMention 
} from '../controllers/entityController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// Global Master Entities
router.get('/', getAllMasterEntities);
router.get('/:id', getEntityProfile);

// Entity Review Action Endpoints
router.post('/review/confirm-merge', confirmEntityMerge);
router.post('/review/keep-separate', keepEntitySeparate);
router.post('/review/edit-canonical', editCanonicalName);
router.post('/review/reject', rejectEntityMention);

export default router;
