import { Router } from 'express';
import { getInvestigators, getAllUsers, createUser } from '../controllers/userController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.get('/investigators', getInvestigators);
router.get('/', requireRole('ADMIN'), getAllUsers);
router.post('/', requireRole('ADMIN'), createUser);

export default router;
