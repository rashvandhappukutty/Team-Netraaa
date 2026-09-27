import { Router } from 'express';
import { 
  getAllEvidence, 
  getEvidenceById, 
  verifyEvidenceIntegrity, 
  downloadEvidenceFile 
} from '../controllers/evidenceController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllEvidence);
router.get('/:id', getEvidenceById);
router.get('/:id/download', downloadEvidenceFile);
router.post('/:id/verify', verifyEvidenceIntegrity);

export default router;
