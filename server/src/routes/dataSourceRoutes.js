import { Router } from 'express';
import { 
  getAllDataSources, 
  getDataSourceById, 
  getDataSourcePreview, 
  getNormalizedRecords, 
  verifyDataSourceIntegrity, 
  downloadOriginalFile 
} from '../controllers/dataSourceController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllDataSources);
router.get('/:id', getDataSourceById);
router.get('/:id/preview', getDataSourcePreview);
router.get('/:id/normalized-records', getNormalizedRecords);
router.get('/:id/download', downloadOriginalFile);
router.post('/:id/verify-integrity', verifyDataSourceIntegrity);

export default router;
