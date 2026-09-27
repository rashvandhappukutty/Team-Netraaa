import { Router } from 'express';
import { getDashboardStats } from '../controllers/statsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.get('/dashboard', getDashboardStats);

export default router;
