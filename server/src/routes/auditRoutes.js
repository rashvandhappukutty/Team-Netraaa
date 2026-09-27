import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.get('/', getAuditLogs);

export default router;
